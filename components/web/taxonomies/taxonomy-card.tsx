import { useTranslations } from "next-intl"
import Link from "next/link"
import type { ComponentProps } from "react"
import { Tile, TileCaption, TileDivider, TileTitle } from "~/components/web/ui/tile"

export interface TaxonomyItem {
  href: string
  name: string
  count: number
}

interface TaxonomyCardProps extends ComponentProps<typeof Tile>, TaxonomyItem {}

export function TaxonomyCard({ href, name, count, ...props }: TaxonomyCardProps) {
  const t = useTranslations("tools")

  return (
    <Tile render={<Link href={href} />} {...props}>
      <TileTitle>{name}</TileTitle>
      <TileDivider />
      <TileCaption>{t("count_tools", { count })}</TileCaption>
    </Tile>
  )
}
