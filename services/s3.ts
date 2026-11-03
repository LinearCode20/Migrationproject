import { S3Client } from "@aws-sdk/client-s3"
import { env } from "~/env"

/**
 * S3 is on only when its region, bucket and both access keys are set. Without it, media
 * is not stored: favicons keep their external URL and admin uploads report the missing storage.
 */
export const isS3Enabled =
  !!env.S3_REGION && !!env.S3_BUCKET && !!env.S3_ACCESS_KEY && !!env.S3_SECRET_ACCESS_KEY

let s3Client: S3Client | undefined

/**
 * The S3 client, created on first use, so a missing key fails the upload that needs it
 * instead of the import.
 * @throws When S3 is not configured.
 */
export function getS3Client() {
  if (!isS3Enabled || !env.S3_ACCESS_KEY || !env.S3_SECRET_ACCESS_KEY) {
    throw new Error(
      "Media storage is not configured. Set S3_REGION, S3_BUCKET, S3_ACCESS_KEY and S3_SECRET_ACCESS_KEY.",
    )
  }

  s3Client ??= new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    maxAttempts: 5,
    retryMode: "standard",
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    forcePathStyle: true,
    requestHandler: { requestTimeout: 30_000, connectionTimeout: 5_000 },
  })

  return s3Client
}
