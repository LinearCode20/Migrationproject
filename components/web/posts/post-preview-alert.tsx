import { getTranslations } from "next-intl/server"
import { PostStatus } from "~/.generated/prisma/browser"
import { Note } from "~/components/common/note"

interface PostPreviewAlertProps {
  status: PostStatus
}

export async function PostPreviewAlert({ status }: PostPreviewAlertProps) {
  const t = await getTranslations("posts")
  if (status === PostStatus.Published) {
    return null
  }

  const message =
    status === PostStatus.Draft ? t("preview_alert.draft") : t("preview_alert.scheduled")

  return <Note className="rounded-lg border border-dashed p-4 text-sm">{message}</Note>
}
