import { connection } from "next/server"
import { PostList } from "~/components/web/posts/post-list"
import { StructuredData } from "~/components/web/structured-data"
import { createGraph, generateBlog } from "~/lib/structured-data"
import { findPublicPosts } from "~/server/posts/queries"

interface PostQueryProps {
  url: string
  title: string
  description: string
}

/**
 * Fetches the public blog posts and renders them as a flat list alongside the
 * blog structured data.
 */
export async function PostQuery({ url, title, description }: PostQueryProps) {
  // Request-time only. This query is skipped at build. See https://dirstarter.com/docs/codebase/caching.
  await connection()

  const posts = await findPublicPosts({})
  const structuredData = createGraph([generateBlog(url, title, description, posts)])

  return (
    <>
      <StructuredData data={structuredData} />
      <PostList posts={posts} />
    </>
  )
}
