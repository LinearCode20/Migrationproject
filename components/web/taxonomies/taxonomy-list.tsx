import type { ComponentProps } from "react"
import { EmptyList } from "~/components/web/empty-list"
import { TaxonomyCard, type TaxonomyItem } from "~/components/web/taxonomies/taxonomy-card"
import { Grid } from "~/components/web/ui/grid"
import { cx } from "~/lib/utils"

interface TaxonomyListProps extends ComponentProps<typeof Grid> {
  items: TaxonomyItem[]
  emptyMessage: string
}

export function TaxonomyList({ items, emptyMessage, className, ...props }: TaxonomyListProps) {
  return (
    <Grid className={cx("gap-x-8", className)} {...props}>
      {items.map(item => (
        <TaxonomyCard key={item.href} {...item} />
      ))}

      {!items.length && <EmptyList>{emptyMessage}</EmptyList>}
    </Grid>
  )
}
