import { getReadTime } from "@dirstack/utils"
import { useFormatter, useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import type { ComponentProps } from "react"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { H4 } from "~/components/common/heading"
import { cx } from "~/lib/utils"
import type { PostMany } from "~/server/posts/payloads"

interface PostCardProps extends ComponentProps<typeof Card> {
  post: PostMany
}

export function PostCard({ className, post, ...props }: PostCardProps) {
  const t = useTranslations()
  const format = useFormatter()

  return (
    <Card
      render={<Link href={`/blog/${post.slug}`} />}
      className={cx("overflow-clip", className)}
      {...props}
    >
      {post.imageUrl && (
        <Image
          src={post.imageUrl}
          alt=""
          width={1200}
          height={630}
          className="-m-5 mb-0 w-[calc(100%+2.5rem)] max-w-none aspect-video object-cover"
        />
      )}

      <CardHeader wrap={false}>
        <H4 render={<h3 />} className="leading-snug!">
          {post.title}
        </H4>
      </CardHeader>

      {post.description && <CardDescription>{post.description}</CardDescription>}

      {post.publishedAt && (
        <CardFooter className="mt-auto">
          <time dateTime={post.publishedAt.toISOString()}>
            {format.dateTime(post.publishedAt, { dateStyle: "medium" })}
          </time>
          <span aria-hidden="true">&bull;</span>
          <span>{t("posts.read_time", { count: getReadTime(post.plainText) })}</span>
        </CardFooter>
      )}
    </Card>
  )
}
