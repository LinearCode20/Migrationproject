import { ArrowUpRightIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { Button } from "~/components/common/button"
import { ToolLink } from "~/components/web/tools/tool-link"
import { hasToolTierCap } from "~/lib/tools"
import type { ToolMany, ToolOne } from "~/server/tools/payloads"

interface ToolButtonProps extends ComponentProps<typeof Button> {
  tool: ToolOne | ToolMany
}

export function ToolButton({ children, tool, ...props }: ToolButtonProps) {
  const t = useTranslations()

  return (
    <Button
      variant={hasToolTierCap(tool, "featuredPlacement") ? "fancy" : "primary"}
      suffix={<ArrowUpRightIcon />}
      {...props}
      render={<ToolLink tool={tool} source="button" />}
    >
      {children ?? t("common.visit", { name: tool.name })}
    </Button>
  )
}
