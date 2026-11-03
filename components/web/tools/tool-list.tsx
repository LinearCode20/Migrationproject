import { getTranslations } from "next-intl/server"
import type { ComponentProps, ReactNode } from "react"
import { EmptyList } from "~/components/web/empty-list"
import { ToolCard, ToolCardSkeleton } from "~/components/web/tools/tool-card"
import { Grid } from "~/components/web/ui/grid"
import type { ToolMany } from "~/server/tools/payloads"

interface ToolListProps extends ComponentProps<typeof Grid> {
  tools: ToolMany[]

  /** Shown instead of the generic message when there are no tools. */
  empty?: ReactNode
}

export async function ToolList({ children, tools, empty, ...props }: ToolListProps) {
  const t = await getTranslations()

  return (
    <Grid {...props}>
      {tools.map((tool, order) => (
        <ToolCard key={tool.slug} tool={tool} style={{ order }} />
      ))}

      {tools.length ? children : (empty ?? <EmptyList>{t("tools.no_tools")}</EmptyList>)}
    </Grid>
  )
}

interface ToolListSkeletonProps {
  count?: number
}

export function ToolListSkeleton({ count = 6 }: ToolListSkeletonProps) {
  return (
    <Grid>
      {[...Array(count)].map((_, index) => (
        <ToolCardSkeleton key={index} />
      ))}
    </Grid>
  )
}
