"use client"

import { SparklesIcon } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import Link from "next/link"
import type { ComponentProps } from "react"
import { Button } from "~/components/common/button"
import { Card } from "~/components/common/card"
import { H5 } from "~/components/common/heading"
import { Note } from "~/components/common/note"
import { type StatusAlertVariant, toolStatusConfig } from "~/config/tool-statuses"
import { useToolAccess } from "~/hooks/use-tool-access"
import { hasToolTierCap } from "~/lib/tools"
import { cx } from "~/lib/utils"
import type { ToolOne } from "~/server/tools/payloads"

const variantClassNames: Record<StatusAlertVariant, string> = {
  info: "bg-info/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
}

interface ToolStatusAlertProps extends ComponentProps<typeof Card> {
  tool: ToolOne
}

export function ToolStatusAlert({ tool, className, ...props }: ToolStatusAlertProps) {
  const t = useTranslations("tools.status_alert.preview")
  const format = useFormatter()
  const { canUpgrade } = useToolAccess(tool.id)
  const variant = toolStatusConfig[tool.status].showsPreviewAlert

  if (variant === null) {
    return null
  }

  return (
    <Card className={cx(variantClassNames[variant], className)} {...props}>
      <H5>
        {t("title")}{" "}
        {tool.publishedAt &&
          t("scheduled", {
            toolName: tool.name,
            date: format.dateTime(tool.publishedAt, { dateStyle: "long" }),
          })}
      </H5>

      {!hasToolTierCap(tool, "doFollow") && (
        <>
          <Note className="-mt-2">
            {canUpgrade
              ? t("upgrade_description", { toolName: tool.name })
              : t("description", { toolName: tool.name })}
          </Note>

          {canUpgrade && (
            <Button
              variant="fancy"
              prefix={<SparklesIcon />}
              render={<Link href={`/submit/${tool.slug}`} />}
            >
              {t("publish_button")}
            </Button>
          )}
        </>
      )}
    </Card>
  )
}
