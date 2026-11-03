import { useTranslations } from "next-intl"
import Link from "next/link"
import { toast } from "sonner"
import type { Tool } from "~/.generated/prisma/client"
import { Button } from "~/components/common/button"
import { Stack } from "~/components/common/stack"
import { siteConfig } from "~/config/site"

interface FeatureNudgeProps {
  tool: Pick<Tool, "name" | "slug">
  toastId: string | number
}

export function FeatureNudge({ tool, toastId }: FeatureNudgeProps) {
  const t = useTranslations("components.feature_nudge")

  return (
    <>
      <p className="text-sm text-secondary-foreground">
        {t("message", { name: tool.name, siteName: siteConfig.name })}
      </p>

      <Stack size="sm" className="w-full mt-4">
        <Button
          size="md"
          render={<Link href={`/submit/${tool.slug}`} />}
          className="flex-1"
          onClick={() => toast.dismiss(toastId)}
        >
          {t("feature_button", { toolName: tool.name })}
        </Button>

        <Button size="md" variant="secondary" onClick={() => toast.dismiss(toastId)}>
          {t("dismiss_button")}
        </Button>
      </Stack>
    </>
  )
}
