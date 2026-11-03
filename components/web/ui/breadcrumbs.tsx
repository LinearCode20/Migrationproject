import { Home } from "lucide-react"
import { useTranslations } from "next-intl"
import { type ComponentProps, Fragment, type ReactNode } from "react"
import { Stack } from "~/components/common/stack"
import { NavLink } from "~/components/web/ui/nav-link"
import { breadcrumbsConfig } from "~/config/breadcrumbs"
import { cx } from "~/lib/utils"

function BreadcrumbsSeparator(props: ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className="text-sm text-ring pointer-events-none select-none"
      {...props}
    >
      /
    </span>
  )
}

interface Breadcrumb {
  url: string
  title: ReactNode
}

interface BreadcrumbsProps extends ComponentProps<typeof Stack> {
  items: Breadcrumb[]
}

export function Breadcrumbs({ className, items, ...props }: BreadcrumbsProps) {
  const t = useTranslations("navigation")
  const breadcrumbItems = [{ url: "/", title: <Home aria-label={t("home")} /> }, ...items]

  return (
    <>
      {breadcrumbsConfig.enabled && (
        <Stack
          size="sm"
          wrap={false}
          render={<nav aria-label={t("breadcrumbs")} />}
          className={cx("-mb-fluid-md pb-3 text-sm", className)}
          {...props}
        >
          {breadcrumbItems.map(({ url, title }, index) => {
            const isCurrent = index === breadcrumbItems.length - 1

            return (
              <Fragment key={index}>
                {index > 0 && <BreadcrumbsSeparator />}
                <NavLink
                  href={url}
                  isActive={isCurrent}
                  aria-current={isCurrent ? "page" : undefined}
                  className="not-last:shrink-0 last:line-clamp-1"
                >
                  {title}
                </NavLink>
              </Fragment>
            )
          })}
        </Stack>
      )}
    </>
  )
}
