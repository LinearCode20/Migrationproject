import { getTranslations } from "next-intl/server"
import { connection } from "next/server"
import { TaxonomyList } from "~/components/web/taxonomies/taxonomy-list"
import { findPublicCategories } from "~/server/categories/queries"

export async function CategoryQuery() {
  // Request-time only. This query is skipped at build. See https://dirstarter.com/docs/codebase/caching.
  await connection()

  const t = await getTranslations("categories")
  const categories = await findPublicCategories({})

  const items = categories.map(({ slug, name, _count }) => ({
    href: `/categories/${slug}`,
    name,
    count: _count.tools,
  }))

  return <TaxonomyList items={items} emptyMessage={t("no_categories")} />
}
