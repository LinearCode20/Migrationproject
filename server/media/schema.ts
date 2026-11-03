import { z } from "zod"
import { entityMediaPathSchema, mediaBase64Schema } from "~/server/shared/media/schema"

const mediaTypeSchema = z.enum(["favicon", "screenshot"])

export const fetchMediaSchema = z.object({
  url: z.url({ protocol: /^https?$/, normalize: true }),
  path: entityMediaPathSchema,
  type: mediaTypeSchema.default("favicon"),
})

export const uploadMediaSchema = z.object({
  path: entityMediaPathSchema,
  base64: mediaBase64Schema,
  type: mediaTypeSchema.optional(),
})
