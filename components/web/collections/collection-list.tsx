import { getTranslations } from "next-intl/server"
import { CollectionCard } from "~/components/web/collections/collection-card"
import { Grid } from "~/components/web/ui/grid"
import { collections } from "~/config/collections"
import { siteConfig } from "~/config/site"

export async function CollectionList() {
  const t = await getTranslations()

  return (
    <Grid>
      {collections.map((collection, order) => (
        <CollectionCard
          key={collection.slug}
          collection={collection}
          name={t(`pages.collections.${collection.slug}.name`)}
          description={t(`pages.collections.${collection.slug}.description`, {
            siteName: siteConfig.name,
          })}
          style={{ order }}
        />
      ))}
    </Grid>
  )
}
