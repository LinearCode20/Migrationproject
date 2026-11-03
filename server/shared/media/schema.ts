import { formatBytes, isMimeTypeMatch } from "@dirstack/utils"
import { z } from "zod"

export const ALLOWED_MIMETYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]

export const MAX_MEDIA_UPLOAD_BYTES = 1024 * 1024

export const entityMediaPathSchema = z.string().regex(/^[a-z0-9/_-]+$/i)

export const mediaContentTypeSchema = z
  .string()
  .refine(type => isMimeTypeMatch(type, ALLOWED_MIMETYPES), { message: "Invalid file type" })

export const mediaContentLengthSchema = z
  .number()
  .int()
  .min(1, "Content length must be at least 1 byte")
  .max(
    MAX_MEDIA_UPLOAD_BYTES,
    `File exceeds the ${formatBytes(MAX_MEDIA_UPLOAD_BYTES)} upload limit`,
  )

export const mediaBase64Schema = z.base64("Invalid file data")
