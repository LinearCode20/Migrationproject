import { getBalancedColumns } from "@dirstack/utils"
import { PlusIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { connection } from "next/server"
import type { ComponentProps } from "react"
import { Card } from "~/components/common/card"
import { H5 } from "~/components/common/heading"
import { Tooltip } from "~/components/common/tooltip"
import { ToolHoverCard } from "~/components/web/tools/tool-hover-card"
import { ToolLink } from "~/components/web/tools/tool-link"
import { Favicon } from "~/components/web/ui/favicon"
import { getToolTiersWith } from "~/lib/tools"
import { findPublicTools } from "~/server/tools/queries"

export async function FeaturedToolsIcons(props: ComponentProps<typeof Card>) {
  await connection()

  const t = await getTranslations()
  const tools = await findPublicTools({
    where: { tier: { in: getToolTiersWith("featuredPlacement") } },
  })
  const showAddButton = tools.length < 12

  if (!tools.length) {
    return null
  }

  const columns = getBalancedColumns(tools.length + (showAddButton ? 1 : 0), 6, 7)

  return (
    <Card {...props}>
      <H5 render={<strong />}>{t("navigation.featured_tools")}:</H5>

      <div
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        className="grid gap-2 w-full -mt-1"
      >
        {tools.map(tool => (
          <ToolHoverCard
            key={tool.slug}
            tool={tool}
            render={
              <ToolLink
                tool={tool}
                source="supporter"
                aria-label={tool.name}
                className="w-full aspect-square hover:*:bg-muted"
              />
            }
          >
            <Favicon
              // `faviconUrl` can be an empty string, which must fall back too.
              src={tool.faviconUrl || "/favicon.png"}
              contained
              className="size-full p-1.5 rounded-lg"
            />
          </ToolHoverCard>
        ))}

        {showAddButton && (
          <Tooltip tooltip={t("components.featured_tools.add_tooltip")}>
            <Link
              href="/submit"
              aria-label={t("components.featured_tools.add_tooltip")}
              className="grid place-items-center size-full aspect-square p-1 rounded-lg border hover:bg-muted"
            >
              <PlusIcon className="size-6" />
            </Link>
          </Tooltip>
        )}
      </div>
    </Card>
  )
}
