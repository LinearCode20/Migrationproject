import Link from "next/link"
import type { ComponentProps } from "react"
import { Card, CardDescription, CardHeader, CardIcon } from "~/components/common/card"
import { H4 } from "~/components/common/heading"
import type { Collection } from "~/config/collections"

interface CollectionCardProps extends ComponentProps<typeof Card> {
  collection: Collection
  name: string
  description: string
}

export function CollectionCard({ collection, name, description, ...props }: CollectionCardProps) {
  const Icon = collection.icon

  return (
    <Card isRevealed render={<Link href={`/collections/${collection.slug}`} />} {...props}>
      <CardHeader wrap={false}>
        <Icon className="size-8 shrink-0 stroke-[1.5] text-muted-foreground" />

        <H4 render={<h3 />} className="truncate">
          {name}
        </H4>
      </CardHeader>

      <CardDescription className="line-clamp-4">{description}</CardDescription>

      <CardIcon>
        <Icon />
      </CardIcon>
    </Card>
  )
}
