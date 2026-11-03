import { isFuture } from "date-fns"
import { ClockIcon } from "lucide-react"
import { getFormatter, getTranslations } from "next-intl/server"
import type { ComponentProps, ReactNode } from "react"
import { ToolStatus, ToolTier } from "~/.generated/prisma/browser"
import { Note } from "~/components/common/note"
import { getQueueMonths, isQueueLong } from "~/lib/products"
import { cx } from "~/lib/utils"
import type { ToolOne } from "~/server/tools/payloads"
import { countSubmittedTools } from "~/server/tools/queries"

interface QueueNoteProps extends ComponentProps<typeof Note> {
  tool: Pick<ToolOne, "name" | "tier" | "status" | "publishedAt">
}

function strong(chunks: ReactNode) {
  return <strong className="font-medium">{chunks}</strong>
}

/**
 * The expected wait for a free listing. A pending tool waits for the whole queue, the same
 * estimate the submission email gives. A scheduled tool already has its date. Once that date
 * passes, the publish cron is about to list the tool, so the note shows nothing.
 */
export async function QueueNote({ tool, className, ...props }: QueueNoteProps) {
  if (tool.tier !== ToolTier.Free) {
    return
  }

  const t = await getTranslations("pages.submit.queue")
  const { name } = tool
  let message: ReactNode

  if (tool.status === ToolStatus.Scheduled && tool.publishedAt && isFuture(tool.publishedAt)) {
    const format = await getFormatter()
    const date = format.dateTime(tool.publishedAt, { dateStyle: "long" })

    message = t.rich("scheduled", { name, date, strong })
  }

  if (tool.status === ToolStatus.Pending) {
    const queue = await countSubmittedTools()

    if (isQueueLong(queue)) {
      message = t.rich("pending", { name, months: getQueueMonths(queue), strong })
    }
  }

  if (!message) {
    return
  }

  return (
    <Note
      className={cx(
        "flex items-center gap-2 rounded-md bg-warning/10 px-3 py-1.5 text-foreground",
        className,
      )}
      {...props}
    >
      <ClockIcon className="size-4 shrink-0" />
      <span>{message}</span>
    </Note>
  )
}
