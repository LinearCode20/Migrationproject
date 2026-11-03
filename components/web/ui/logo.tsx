import Link from "next/link"
import type { ComponentProps } from "react"
import { Stack } from "~/components/common/stack"
import { LogoSymbol } from "~/components/web/ui/logo-symbol"
import { siteConfig } from "~/config/site"
import { cx } from "~/lib/utils"

export function Logo({ className, ...props }: ComponentProps<typeof Stack>) {
  return (
    <Stack
      size="sm"
      wrap={false}
      render={<Link href="/" />}
      className={cx("group/logo", className)}
      {...props}
    >
      <LogoSymbol />
      <span className="font-medium text-sm truncate">{siteConfig.name}</span>
    </Stack>
  )
}
