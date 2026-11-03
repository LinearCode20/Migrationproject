"use client"

import { getPageLink } from "@dirstack/utils"
import { usePagination } from "@mantine/hooks"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { usePathname, useSearchParams } from "next/navigation"
import type { ComponentProps } from "react"
import { Note } from "~/components/common/note"
import { NavLink, navLinkVariants } from "~/components/web/ui/nav-link"
import { cx } from "~/lib/utils"

interface PaginationLinkProps extends ComponentProps<typeof NavLink> {
  isDisabled?: boolean
}

function PaginationLink({ isDisabled, children, prefix, suffix, ...props }: PaginationLinkProps) {
  if (isDisabled) {
    return (
      <NavLink prefix={prefix} suffix={suffix} render={<button type="button" disabled />}>
        {children}
      </NavLink>
    )
  }

  return (
    <NavLink prefix={prefix} suffix={suffix} {...props}>
      {children}
    </NavLink>
  )
}

interface PaginationProps extends ComponentProps<"nav"> {
  pageCount: number
  page?: number
  siblings?: number
  boundaries?: number
}

export function Pagination({
  className,
  pageCount,
  page = 1,
  siblings,
  boundaries,
  ...props
}: PaginationProps) {
  const t = useTranslations("components.pagination")
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pagination = usePagination({
    total: pageCount,
    page,
    siblings,
    boundaries,
  })

  if (pagination.range.length <= 1) {
    return null
  }

  return (
    <nav
      aria-label={t("label")}
      className={cx("-mt-px flex w-full items-start justify-between text-sm md:w-auto", className)}
      {...props}
    >
      <PaginationLink
        isDisabled={page <= 1}
        href={getPageLink(searchParams, pathname, page - 1)}
        prefix={<ArrowLeftIcon />}
        rel="prev"
      >
        {t("prev")}
      </PaginationLink>

      <Note className="md:hidden">{t("page_of", { page, pageCount })}</Note>

      <div className="flex items-center flex-wrap gap-3 max-md:hidden">
        <Note render={<span />}>{t("page_label")}</Note>

        {pagination.range.map((value, index) => (
          <div key={`page-${index}`}>
            {value === "dots" && (
              <span aria-hidden="true" className={navLinkVariants().base()}>
                …
              </span>
            )}

            {typeof value === "number" && (
              <NavLink
                href={getPageLink(searchParams, pathname, value)}
                isActive={value === page}
                aria-current={value === page ? "page" : undefined}
                className={cx("min-w-5 justify-center", value === page && "bg-accent rounded-xs")}
              >
                {value}
              </NavLink>
            )}
          </div>
        ))}
      </div>

      <PaginationLink
        isDisabled={page >= pageCount}
        href={getPageLink(searchParams, pathname, page + 1)}
        suffix={<ArrowRightIcon />}
        rel="next"
      >
        {t("next")}
      </PaginationLink>
    </nav>
  )
}
