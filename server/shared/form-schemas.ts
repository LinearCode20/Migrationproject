import { isMimeTypeMatch } from "@dirstack/utils"
import type { useTranslations } from "next-intl"
import { z } from "zod"
import { ReportType } from "~/.generated/prisma/browser"
import { verificationsConfig } from "~/config/verifications"
import { ALLOWED_MIMETYPES, MAX_MEDIA_UPLOAD_BYTES } from "~/server/shared/media/schema"

/**
 * Translation-aware Zod schema factories shared by client forms.
 *
 * These are kept separate from `server/<entity>/schema.ts` because they take
 * a runtime translation function and produce schemas with localized error
 * messages; they can't be statically imported into oRPC procedures.
 */

type TFunction = ReturnType<typeof useTranslations>

export function createFileSchema(t: TFunction, options?: { maxSize?: number }) {
  const maxSize = options?.maxSize ?? MAX_MEDIA_UPLOAD_BYTES

  return z
    .instanceof(File)
    .refine(({ size }) => size > 0, { error: t("fileCannotBeEmpty") })
    .refine(({ size }) => size <= maxSize, { error: t("fileSizeTooLarge") })
    .refine(({ type }) => isMimeTypeMatch(type, ALLOWED_MIMETYPES), { error: t("fileTypeInvalid") })
}

export function createSubmitToolSchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, { error: t("required") })
      .max(100, { error: issue => t("maxLength", { length: Number(issue.maximum) }) }),
    websiteUrl: z
      .url({ protocol: /^https?$/, normalize: true, error: t("invalidUrl") })
      .min(1, { error: t("required") }),
    submitterNote: z
      .string()
      .max(256, { error: issue => t("maxLength", { length: Number(issue.maximum) }) }),
  })
}

export function createNewsletterSchema(t: TFunction) {
  return z.object({
    captcha: z.literal("").optional(),
    email: z.email({ error: t("invalidEmail") }),
  })
}

export function createReportToolSchema(t: TFunction) {
  return z
    .object({
      type: z.enum(ReportType, { error: t("required") }),
      email: z.email({ error: t("invalidEmail") }),
      message: z
        .string()
        .max(256, { error: issue => t("maxLength", { length: Number(issue.maximum) }) }),
      toolId: z.string(),
    })
    .refine(data => data.type !== ReportType.Other || data.message.length > 0, {
      error: t("required"),
      path: ["message"],
    })
}

export function createVerifyToolEmailSchema(t: TFunction) {
  return z.object({
    toolId: z.string(),
    email: z.email({ error: t("invalidEmail") }),
  })
}

export function createVerifyToolOtpSchema(t: TFunction) {
  return z.object({
    toolId: z.string(),
    otp: z.string().length(verificationsConfig.otpLength, {
      error: issue => t("invalidLength", { length: Number(issue.minimum || issue.maximum) }),
    }),
  })
}
