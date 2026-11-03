import Link from "next/link"
import type { ComponentProps } from "react"
import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardHeader } from "~/components/common/card"
import { H4 } from "~/components/common/heading"
import { ShowMore } from "~/components/common/show-more"
import { Skeleton } from "~/components/common/skeleton"
import { Stack } from "~/components/common/stack"
import { ToolVerifiedBadge } from "~/components/web/tools/tool-verified-badge"
import { Favicon } from "~/components/web/ui/favicon"
import type { ToolMany } from "~/server/tools/payloads"

interface ToolCardProps extends ComponentProps<typeof Card> {
  tool: ToolMany
}

export function ToolCard({ tool, ...props }: ToolCardProps) {
  return (
    <Card interactive isRevealed {...props}>
      <CardHeader wrap={false}>
        <Favicon src={tool.faviconUrl} contained />

        <H4 render={<h3 />} className="truncate">
          <Link href={`/${tool.slug}`}>
            <span className="absolute inset-0 z-10" />
            {tool.name}
          </Link>
        </H4>

        <ToolVerifiedBadge tool={tool} size="md" className="-ml-1.5" />
      </CardHeader>

      <div className="relative size-full flex flex-col min-h-16 overflow-hidden">
        <Stack
          size="lg"
          direction="column"
          className="flex-1 duration-200 group-hover:opacity-0 group-focus-within:opacity-0"
        >
          {tool.tagline && <CardDescription className="min-h-10">{tool.tagline}</CardDescription>}

          <ShowMore limit={1} size="xs" showMoreType="text" className="mt-auto">
            {tool.categories.map(({ slug, name }) => (
              <Badge key={slug} variant="outline">
                {name}
              </Badge>
            ))}
          </ShowMore>
        </Stack>

        {tool.description && (
          <div className="absolute inset-0 opacity-0 duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            <CardDescription className="line-clamp-3">{tool.description}</CardDescription>
          </div>
        )}
      </div>
    </Card>
  )
}

export function ToolCardSkeleton() {
  return (
    <Card className="items-stretch select-none">
      <CardHeader>
        <Favicon src="/favicon.png" contained className="animate-pulse opacity-25 grayscale" />

        <H4 className="w-2/3">
          <Skeleton>&nbsp;</Skeleton>
        </H4>
      </CardHeader>

      <CardDescription className="flex flex-col gap-0.5">
        <Skeleton className="h-5 w-4/5">&nbsp;</Skeleton>
        <Skeleton className="h-5 w-1/2">&nbsp;</Skeleton>
      </CardDescription>

      <Stack size="sm" className="mt-auto">
        {[...Array(2)].map((_, index) => (
          <Badge key={index} variant="outline" className="w-12">
            &nbsp;
          </Badge>
        ))}
      </Stack>
    </Card>
  )
}
