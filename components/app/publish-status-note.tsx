import { formatDateTime } from "@dirstack/utils"
import Link from "next/link"
import type { PostStatus, ToolStatus } from "~/.generated/prisma/browser"
import { siteConfig } from "~/config/site"

interface PublishStatusNoteProps {
  /** Public path of the entity, e.g. `/blog/my-post`. */
  href: string
  status: ToolStatus | PostStatus
  publishedAt: Date | null
}

/** Public URL of a publishable entity, plus its publish or schedule date. */
export function PublishStatusNote({ href, status, publishedAt }: PublishStatusNoteProps) {
  const isScheduled = status === "Scheduled"

  return (
    <>
      <Link href={href} target="_blank" className="text-primary underline">
        {siteConfig.url}
        {href}
      </Link>

      {publishedAt && (isScheduled || status === "Published") && (
        <>
          <br />
          {isScheduled ? "Scheduled to be published" : "Published"} on{" "}
          <strong className="text-foreground">{formatDateTime(publishedAt)}</strong>
        </>
      )}
    </>
  )
}
