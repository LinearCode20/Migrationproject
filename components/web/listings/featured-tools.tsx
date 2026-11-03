import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { connection } from "next/server"
import type { ComponentProps } from "react"
import { Listing } from "~/components/web/listing"
import { ToolList } from "~/components/web/tools/tool-list"
import { getToolTiersWith } from "~/lib/tools"
import { findPublicTools } from "~/server/tools/queries"

type FeaturedToolsProps = Omit<ComponentProps<typeof Listing>, "title">

export async function FeaturedTools(props: FeaturedToolsProps) {
  await connection()

  const tools = await findPublicTools({
    where: { tier: { in: getToolTiersWith("featuredPlacement") } },
    take: 6,
  })

  if (!tools.length) {
    return null
  }

  const t = await getTranslations()

  return (
    <Listing
      title={t("navigation.featured_tools")}
      button={<Link href="/" />}
      buttonLabel={t("components.listings.view_all_tools")}
      {...props}
    >
      <ToolList tools={tools} />
    </Listing>
  )
}
