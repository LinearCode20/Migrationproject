"use client"

import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { NavAction } from "~/components/web/nav"
import { useToolDialog } from "~/hooks/use-tool-dialog"

export function ToolReportLink(props: ComponentProps<typeof NavAction>) {
  const t = useTranslations("tools.nav")
  const [, setDialog] = useToolDialog()

  return (
    <NavAction onClick={() => setDialog("report")} {...props}>
      {t("report")}
    </NavAction>
  )
}
