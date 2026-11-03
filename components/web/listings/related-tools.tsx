import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { connection } from "next/server"
import type { ComponentProps } from "react"
import { Listing } from "~/components/web/listing"
import { FeaturedTools } from "~/components/web/listings/featured-tools"
import { ToolList, ToolListSkeleton } from "~/components/web/tools/tool-list"
import type { ToolOne } from "~/server/tools/payloads"
import { findRelatedTools } from "~/server/tools/queries"

interface RelatedToolsProps extends Omit<ComponentProps<typeof Listing>, "title"> {
  tool: ToolOne
}

export async function RelatedTools({ tool, ...props }: RelatedToolsProps) {
  await connection()

  const t = await getTranslations("components.listings")
  const tools = await findRelatedTools({ slug: tool.slug })

  if (!tools.length) {
    return <FeaturedTools />
  }

  const [category] = tool.categories

  return (
    <Listing
      title={t("similar_to", { toolName: tool.name })}
      button={<Link href={category ? `/categories/${category.slug}` : "/"} />}
      buttonLabel={
        category ? t("more_in_category", { category: category.name }) : t("view_all_tools")
      }
      {...props}
    >
      <ToolList tools={tools} />
    </Listing>
  )
}

export async function RelatedToolsSkeleton({ tool, ...props }: RelatedToolsProps) {
  const t = await getTranslations("components.listings")

  return (
    <Listing title={t("similar_to", { toolName: tool.name })} {...props}>
      <ToolListSkeleton count={3} />
    </Listing>
  )
}
