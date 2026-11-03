import { parseAsArrayOf, parseAsString, parseAsStringEnum } from "nuqs/server"
import { z } from "zod"
import { type Report, ReportType } from "~/.generated/prisma/browser"
import { arrayable, createListParams, createListSchema } from "~/server/shared/list"
import { idSchema } from "~/server/shared/schemas"

const reportSortFields = ["message", "type", "email", "createdAt", "updatedAt"] as const

const reportDefaultSort = { id: "createdAt", desc: true } as const

export const reportListSchema = createListSchema(reportSortFields, reportDefaultSort, 50).extend({
  message: z.string().default(""),
  type: arrayable(z.enum(ReportType)).default([]),
})

export type ReportListParams = z.infer<typeof reportListSchema>

export const reportListParams = {
  ...createListParams<Report>(reportDefaultSort, 50),
  message: parseAsString.withDefault(""),
  type: parseAsArrayOf(parseAsStringEnum(Object.values(ReportType))).withDefault([]),
}

const reportFieldsSchema = z.object({
  email: z.email().optional(),
  type: z.enum(ReportType),
  message: z.string().optional(),
  toolId: z.string().optional(),
})

export const reportUpdateSchema = reportFieldsSchema.partial().extend(idSchema.shape)

export const reportToolSchema = z
  .object({
    type: z.enum(ReportType),
    email: z.email(),
    message: z.string().max(256),
    toolId: z.string(),
  })
  .refine(data => data.type !== ReportType.Other || data.message.length > 0, {
    path: ["message"],
  })
