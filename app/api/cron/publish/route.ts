import { PostStatus, ToolStatus } from "~/.generated/prisma/client"
import { env } from "~/env"
import { sendEvent } from "~/server/events"
import { db } from "~/services/db"

export const maxDuration = 60

/** Runs daily at midnight UTC, per `vercel.json`. */
export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  const now = new Date()

  const [tools, posts] = await Promise.all([
    db.tool.findMany({
      where: { status: ToolStatus.Scheduled, publishedAt: { lte: now } },
    }),
    db.post.findMany({
      where: { status: PostStatus.Scheduled, publishedAt: { lte: now } },
    }),
  ])

  if (tools.length) {
    console.info(`Publishing ${tools.length} tools`)

    await db.tool.updateMany({
      where: { id: { in: tools.map(tool => tool.id) } },
      data: { status: ToolStatus.Published },
    })

    for (const tool of tools) {
      sendEvent("tool.status_changed", {
        toolId: tool.id,
        previousStatus: tool.status,
        newStatus: ToolStatus.Published,
        notifyOwner: true,
      })
    }
  }

  if (posts.length) {
    console.info(`Publishing ${posts.length} posts`)

    await db.post.updateMany({
      where: { id: { in: posts.map(post => post.id) } },
      data: { status: PostStatus.Published },
    })

    for (const post of posts) {
      sendEvent("post.status_changed", {
        postId: post.id,
        previousStatus: post.status,
        newStatus: PostStatus.Published,
      })
    }
  }

  return Response.json({ success: true })
}
