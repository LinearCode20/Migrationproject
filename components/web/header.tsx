import { useTranslations } from "next-intl"
import Link from "next/link"
import type { ComponentProps } from "react"
import { Button } from "~/components/common/button"
import { Stack } from "~/components/common/stack"
import { MobileNav } from "~/components/web/mobile-nav"
import { NavMenu } from "~/components/web/nav-menu"
import { SearchButton } from "~/components/web/search-button"
import { ThemeSwitcher } from "~/components/web/theme-switcher"
import { Container } from "~/components/web/ui/container"
import { Logo } from "~/components/web/ui/logo"
import { UserMenu } from "~/components/web/user-menu"
import { cx } from "~/lib/utils"

export function Header({ className, ...props }: ComponentProps<"div">) {
  const t = useTranslations()

  return (
    <header
      className={cx("fixed top-(--header-top) inset-x-0 z-50 bg-background", className)}
      {...props}
    >
      <Container>
        <div className="flex items-center py-3.5 gap-4 text-sm h-(--header-height) md:gap-6 lg:gap-8">
          <Stack size="sm" wrap={false} className="min-w-0">
            <MobileNav />

            <Logo className="min-w-0" />
          </Stack>

          <NavMenu className="flex-1" />

          <Stack size="sm" wrap={false} className="justify-end max-lg:grow">
            <SearchButton />

            <ThemeSwitcher className="p-1 -ml-1 text-base" />

            <Button
              size="sm"
              variant="secondary"
              render={<Link href="/submit" />}
              className="max-sm:hidden"
            >
              {t("navigation.submit")}
            </Button>

            <UserMenu />
          </Stack>
        </div>
      </Container>
    </header>
  )
}
