import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { EmptyList } from "~/components/web/empty-list"
import { PostCard } from "~/components/web/posts/post-card"
import { Grid } from "~/components/web/ui/grid"
import type { PostMany } from "~/server/posts/payloads"

interface PostListProps extends ComponentProps<typeof Grid> {
  posts: PostMany[]
}

export function PostList({ children, posts, ...props }: PostListProps) {
  const t = useTranslations()

  return (
    <Grid {...props}>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}

      {!posts.length && <EmptyList>{t("posts.no_posts")}</EmptyList>}
      {children}
    </Grid>
  )
}
