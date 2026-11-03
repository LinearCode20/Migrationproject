import { CopyObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { formatBytes, getDomain, getErrorMessage, tryCatch } from "@dirstack/utils"
import { fileTypeFromBuffer } from "file-type"
import wretch from "wretch"
import { env, getS3PublicUrl, isProd } from "~/env"
import { withTimeout } from "~/lib/http"
import { MAX_MEDIA_UPLOAD_BYTES, mediaContentTypeSchema } from "~/server/shared/media/schema"
import { getS3Client, isS3Enabled } from "~/services/s3"

export class UnsupportedMediaTypeError extends Error {
  constructor(key: string) {
    super(`Unsupported media type for ${key}`)
    this.name = "UnsupportedMediaTypeError"
  }
}

export class MediaNotConfiguredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MediaNotConfiguredError"
  }
}

/**
 * ScreenshotOne is on only when its access key is set. Without it, tools get no screenshot.
 */
export const isScreenshotOneEnabled = !!env.SCREENSHOTONE_ACCESS_KEY

/**
 * Uploads a file to S3 and returns the S3 location.
 * @param file - The file buffer to upload.
 * @param key - The S3 key to upload the file to (without extension)
 * @returns The S3 location of the uploaded file.
 * @throws MediaNotConfiguredError when S3 is not configured.
 */
export async function uploadToS3Storage(file: Buffer, key: string) {
  if (!isS3Enabled) {
    throw new MediaNotConfiguredError("Media storage is not configured.")
  }

  const endpoint = getS3PublicUrl()
  const fileType = await fileTypeFromBuffer(file)
  const contentType = mediaContentTypeSchema.safeParse(fileType?.mime)

  if (!fileType || !contentType.success) {
    throw new UnsupportedMediaTypeError(key)
  }

  const s3Key = `${key}.${fileType.ext}`

  const upload = new Upload({
    client: getS3Client(),
    params: {
      Bucket: env.S3_BUCKET,
      Key: s3Key,
      Body: file,
      ContentType: contentType.data,
      // Safe to cache forever: returned URLs are versioned with ?v=timestamp.
      CacheControl: "public, max-age=31536000, immutable",
      StorageClass: "STANDARD",
    },
    queueSize: 4,
    partSize: 1024 * 1024 * 5,
    leavePartsOnError: false,
  })

  const { data, error } = await tryCatch(upload.done())

  if (error) {
    throw new Error(`Failed to upload ${key} to S3: ${getErrorMessage(error)}`)
  }

  if (!data.Key) {
    throw new Error(`Failed to upload ${key} to S3`)
  }

  return `${endpoint}/${data.Key}?v=${Date.now()}`
}

/**
 * Normalizes a favicon before it is stored. satori draws favicons into the
 * generated images but cannot decode WebP or AVIF, so raster input becomes a
 * palette PNG capped at 256px. SVG passes through untouched: satori draws it
 * and rasterizing would lose quality. Hosts where sharp cannot load, such as
 * Cloudflare Workers, store the original file instead.
 * @param buffer - The favicon file buffer.
 * @returns The normalized favicon buffer.
 */
export async function normalizeFavicon(buffer: Buffer) {
  // Loaded lazily so libvips only lands in memory when a favicon is processed.
  const { data: sharpModule, error } = await tryCatch(import("sharp"))

  if (error) {
    console.error("sharp failed to load, storing the favicon unconverted:", error)
    return buffer
  }

  const sharp = sharpModule.default

  // This runs rarely, so skip the operation cache and keep libvips to one thread.
  sharp.cache(false)
  sharp.concurrency(1)

  const fileType = await fileTypeFromBuffer(buffer)

  // The file-type package only detects binary formats, so SVG markup is left to libvips.
  if (!fileType) {
    const { data } = await tryCatch(sharp(buffer).metadata())

    if (data?.format === "svg") {
      return buffer
    }
  }

  if (!mediaContentTypeSchema.safeParse(fileType?.mime).success) {
    throw new UnsupportedMediaTypeError("favicon")
  }

  // "inside" keeps the aspect ratio without padding, unlike "contain", which
  // would pad a small favicon out to a 256px transparent canvas.
  return sharp(buffer)
    .resize(256, 256, { fit: "inside", withoutEnlargement: true })
    .png({ palette: true, compressionLevel: 9, effort: 10 })
    .toBuffer()
}

/**
 * Removes a directory from S3.
 * @param directory - The directory to remove.
 */
async function removeS3Directory(directory: string) {
  // Safety flag to prevent accidental deletion of S3 files.
  if (!isProd || !isS3Enabled) {
    return
  }

  const s3Client = getS3Client()
  let continuationToken: string | undefined

  do {
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: env.S3_BUCKET,
        Prefix: `${directory}/`,
        ContinuationToken: continuationToken,
      }),
    )

    const keys = (listResponse.Contents ?? []).flatMap(({ Key }) => (Key ? [{ Key }] : []))

    // DeleteObjects removes up to 1000 keys per request, matching ListObjectsV2's page size.
    if (keys.length > 0) {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: env.S3_BUCKET,
          Delete: { Objects: keys },
        }),
      )
    }

    continuationToken = listResponse.NextContinuationToken
  } while (continuationToken)
}

/**
 * Removes a list of directories from S3.
 * @param directories - The directories to remove.
 */
export async function removeS3Directories(directories: string[]) {
  for (const directory of directories) {
    await removeS3Directory(directory)
  }
}

/**
 * Copies every object in an S3 directory to another directory, keeping each
 * object's relative key. Media keys are plain ASCII, so `CopySource` needs no encoding.
 * @param from - The directory to copy from.
 * @param to - The directory to copy to.
 */
async function copyS3Directory(from: string, to: string) {
  const s3Client = getS3Client()
  let continuationToken: string | undefined

  do {
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: env.S3_BUCKET,
        Prefix: `${from}/`,
        ContinuationToken: continuationToken,
      }),
    )

    for (const { Key } of listResponse.Contents ?? []) {
      if (!Key) {
        continue
      }

      await s3Client.send(
        new CopyObjectCommand({
          Bucket: env.S3_BUCKET,
          CopySource: `${env.S3_BUCKET}/${Key}`,
          Key: `${to}/${Key.slice(from.length + 1)}`,
        }),
      )
    }

    continuationToken = listResponse.NextContinuationToken
  } while (continuationToken)
}

/**
 * Gives a duplicated record its own copy of the original's media, so deleting the original
 * keeps the copy's images. Returns a function that points a media URL (or a body that embeds
 * them) at the copy. Without S3, or when the copy fails, the URLs keep pointing at the
 * original's media.
 * @param from - The original's media directory.
 * @param to - The duplicate's media directory.
 * @returns A function that rewrites the original's media URLs to the duplicate's.
 */
export async function duplicateS3Media(from: string, to: string) {
  if (!isS3Enabled) {
    return (value: string) => value
  }

  const { error } = await tryCatch(copyS3Directory(from, to))

  if (error) {
    console.error(`Failed to copy media from ${from} to ${to}:`, error)
    return (value: string) => value
  }

  return (value: string) => value.replaceAll(`/${from}/`, `/${to}/`)
}

/**
 * Gets the URL of the favicon API endpoint.
 * @param url - The URL of the website to fetch the favicon from.
 * @returns The URL of the favicon API endpoint.
 */
function getFaviconFetchUrl(url: string) {
  const options = new URLSearchParams({
    domain_url: getDomain(url),
    sz: "128",
  })

  return `https://www.google.com/s2/favicons?${options.toString()}`
}

interface ScreenshotFetchOptions {
  /** Pass `false` to force a fresh capture, such as after a site redesign. */
  cache?: boolean
}

/**
 * Gets the URL of the screenshot API endpoint.
 * @param url - The URL of the website to fetch the screenshot from.
 * @param options.cache - Whether the screenshot service may return a cached screenshot.
 * @returns The URL of the screenshot API endpoint.
 * @throws MediaNotConfiguredError when ScreenshotOne is not configured.
 */
export function getScreenshotFetchUrl(url: string, { cache = true }: ScreenshotFetchOptions = {}) {
  if (!isScreenshotOneEnabled || !env.SCREENSHOTONE_ACCESS_KEY) {
    throw new MediaNotConfiguredError("Screenshots are not configured.")
  }

  const params = new URLSearchParams({
    url,
    access_key: env.SCREENSHOTONE_ACCESS_KEY,
    cache: String(cache),

    // Blockers.
    delay: "1",
    block_ads: "true",
    block_chats: "true",
    block_trackers: "true",
    block_cookie_banners: "true",

    // Image and viewport options.
    format: "webp",
    viewport_width: "1280",
    viewport_height: "720",
    image_quality: "90",
  })

  return `https://api.screenshotone.com/take?${params.toString()}`
}

/**
 * Fetches media (favicon or screenshot) from a URL and uploads it to S3. Without S3, a
 * favicon keeps its external URL. A screenshot can't, because its capture URL carries the
 * ScreenshotOne key.
 * @param url - The website URL to fetch media from.
 * @param path - The S3 key path (without extension).
 * @param type - The type of media to fetch ("favicon" or "screenshot").
 * @returns The S3 URL of the uploaded file. Throws when the fetch or upload fails.
 */
export async function fetchAndUploadMedia(
  url: string,
  path: string,
  type: "favicon" | "screenshot",
) {
  if (!isS3Enabled) {
    if (type === "favicon") {
      return getFaviconFetchUrl(url)
    }

    throw new MediaNotConfiguredError("Media storage is not configured.")
  }

  const endpoint = type === "favicon" ? getFaviconFetchUrl(url) : getScreenshotFetchUrl(url)
  const { data, error } = await tryCatch(
    wretch(endpoint).options(withTimeout(30_000)).get().arrayBuffer().then(Buffer.from),
  )

  if (error) {
    throw new Error(`Failed to fetch ${type} from ${url}: ${getErrorMessage(error)}`)
  }

  if (data.length > MAX_MEDIA_UPLOAD_BYTES) {
    throw new Error(
      `Fetched ${type} exceeds the ${formatBytes(MAX_MEDIA_UPLOAD_BYTES)} upload limit`,
    )
  }

  const file = type === "favicon" ? await normalizeFavicon(data) : data

  return uploadToS3Storage(file, path)
}
