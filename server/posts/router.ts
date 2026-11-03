import { createId } from "@paralleldrive/cuid2"
import { after } from "next/server"
import { duplicateS3Media, removeS3Directories } from "~/lib/media"
import { sendEvent } from "~/server/events"
import type { SessionUser } from "~/server/orpc/context"
import { ensureFound } from "~/server/orpc/helpers"
import { authedProcedure } from "~/server/orpc/procedure"
import { createPost, removePosts, updatePost } from "~/server/posts/mutations"
import { findPostById, findPosts } from "~/server/posts/queries"
import { postCreateSchema, postListSchema, postUpdateSchema } from "~/server/posts/schema"
import { idSchema, idsSchema } from "~/server/shared/schemas"

const adminReads = authedProcedure.meta({
  permission: "posts.read",
})

const adminWrites = authedProcedure.meta({
  permission: "posts.update",
})

export const posts = {
  list: adminReads
    .meta({
      mcp: {
        name: "list_posts",
        description:
          "List blog posts, newest first, without their content. Filter by `title` and by `status`, and page with `page` and `perPage` (at most 100). Returns `posts`, `total` and `pageCount`.",
        annotations: { readOnlyHint: true, openWorldHint: false },
        omit: ["content", "plainText"],
      },
    })
    .input(postListSchema)
    .handler(async ({ input }) => findPosts(input)),

  byId: adminReads
    .meta({
      mcp: {
        name: "get_post",
        description: "Get one blog post by `id`, with its Markdown content.",
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
    })
    .input(idSchema)
    .handler(async ({ input: { id } }) => ensureFound(await findPostById(id), "Post")),

  create: adminWrites
    .meta({
      permission: "posts.create",
      mcp: {
        name: "create_post",
        description:
          "Create a blog post. `title` and `content` (Markdown) are required. Also pass `plainText`, the content without Markdown, which sets the read time and the RSS summary. The post is a Draft unless you set `status`. To schedule it, set `status` to Scheduled and `publishedAt` to an ISO date. The author is the site's first admin account unless you pass `authorId`.",
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
        defaults: { authorId: (user: SessionUser) => user.id },
      },
    })
    .input(postCreateSchema)
    .handler(async ({ input }) => {
      const post = await createPost({ data: input })

      sendEvent("post.status_changed", {
        postId: post.id,
        previousStatus: null,
        newStatus: post.status,
      })

      return post
    }),

  update: adminWrites
    .meta({
      mcp: {
        name: "update_post",
        description:
          "Update a blog post by `id`. Send only the fields to change. When you change `content`, also send its `plainText`. Changing `title` also changes the slug and URL unless you pass the current `slug`.",
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      },
    })
    .input(postUpdateSchema)
    .handler(async ({ input }) => {
      const { id, ...data } = input

      const existingPost = ensureFound(await findPostById(id), "Post")

      const post = await updatePost({
        id,
        data,
        nameOrSlug: data.slug || data.title,
        currentSlug: existingPost.slug,
      })

      if (existingPost.status !== post.status) {
        sendEvent("post.status_changed", {
          postId: post.id,
          previousStatus: existingPost.status,
          newStatus: post.status,
        })
      }

      return post
    }),

  duplicate: adminWrites.input(idSchema).handler(async ({ input: { id } }) => {
    const post = ensureFound(await findPostById(id), "Post")
    const newId = createId()
    const moveMedia = await duplicateS3Media(`posts/${post.id}`, `posts/${newId}`)

    const newPost = await createPost({
      data: {
        id: newId,
        title: `${post.title} (Copy)`,
        description: post.description,
        content: moveMedia(post.content),
        plainText: post.plainText,
        imageUrl: post.imageUrl && moveMedia(post.imageUrl),
        authorId: post.authorId,
      },
    })

    return newPost
  }),

  remove: adminWrites
    .meta({ permission: "posts.delete" })
    .input(idsSchema)
    .handler(async ({ input: { ids } }) => {
      const { posts } = await removePosts(ids)

      after(async () => {
        if (posts.length) {
          await removeS3Directories(posts.map(post => `posts/${post.id}`))
        }
      })

      return { success: true }
    }),
}
