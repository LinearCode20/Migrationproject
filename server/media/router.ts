import { tryCatch } from "@dirstack/utils"
import { ORPCError } from "@orpc/server"
import {
  fetchAndUploadMedia,
  MediaNotConfiguredError,
  normalizeFavicon,
  UnsupportedMediaTypeError,
  uploadToS3Storage,
} from "~/lib/media"
import { fetchMediaSchema, uploadMediaSchema } from "~/server/media/schema"
import { authedProcedure } from "~/server/orpc/procedure"
import { mediaContentLengthSchema } from "~/server/shared/media/schema"

const adminMedia = authedProcedure.meta({
  permission: "media.write",
})

/**
 * Run a media upload, reporting an unsupported file type as `BAD_REQUEST` and a missing
 * storage or screenshot service as `PRECONDITION_FAILED`, so the admin sees why the upload failed.
 */
async function withMediaErrors(upload: () => Promise<string>) {
  const { data, error } = await tryCatch(upload())

  if (error instanceof UnsupportedMediaTypeError) {
    throw new ORPCError("BAD_REQUEST", { message: error.message })
  }

  if (error instanceof MediaNotConfiguredError) {
    throw new ORPCError("PRECONDITION_FAILED", { message: error.message })
  }

  if (error) {
    throw error
  }

  return data
}

export const media = {
  fetch: adminMedia
    .input(fetchMediaSchema)
    .handler(async ({ input }) =>
      withMediaErrors(() => fetchAndUploadMedia(input.url, input.path, input.type)),
    ),

  upload: adminMedia.input(uploadMediaSchema).handler(async ({ input: { path, base64, type } }) => {
    const buffer = Buffer.from(base64, "base64")
    const contentLength = mediaContentLengthSchema.safeParse(buffer.length)

    if (!contentLength.success) {
      throw new ORPCError("BAD_REQUEST", {
        message: contentLength.error.issues[0]?.message ?? "Invalid file size",
      })
    }

    return withMediaErrors(async () => {
      const file = type === "favicon" ? await normalizeFavicon(buffer) : buffer
      return uploadToS3Storage(file, path)
    })
  }),
}
