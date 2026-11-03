import { formatNumber } from "@dirstack/utils"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { H5, H6 } from "~/components/common/heading"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"
import { BuiltWith } from "~/components/web/built-with"
import { CTAForm } from "~/components/web/cta-form"
import { FooterActions } from "~/components/web/footer-actions"
import { NavLink } from "~/components/web/ui/nav-link"
import { collections } from "~/config/collections"
import { siteConfig } from "~/config/site"
import { cx } from "~/lib/utils"

export function Footer({ children, className, ...props }: ComponentProps<"footer">) {
  const t = useTranslations()

  return (
    <footer
      className={cx(
        "flex flex-col gap-y-8 mt-auto pt-fluid-md border-t border-foreground/10",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-y-10 md:flex-row md:items-start md:justify-between md:gap-x-12">
        <Stack direction="column" className="items-start gap-4 md:max-w-64">
          <Stack size="lg" direction="column" className="min-w-0">
            <H5 render={<strong />} className="px-0.5">
              {t("components.footer.cta_title")}
            </H5>

            <Note className="-mt-2 px-0.5 first:mt-0">
              {t("components.footer.cta_description", {
                count: formatNumber(siteConfig.stats.subscribers),
              })}
            </Note>

            <CTAForm source="footer" />
          </Stack>

          <FooterActions className="text-lg opacity-75" />
        </Stack>

        <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:flex md:gap-x-10 lg:gap-x-14">
          <Stack direction="column" className="text-sm">
            <H6 render={<strong />}>{t("navigation.browse")}:</H6>

            <NavLink href="/">{t("navigation.tools")}</NavLink>
            <NavLink href="/categories">{t("navigation.categories")}</NavLink>
            <NavLink href="/tags">{t("navigation.tags")}</NavLink>
            <NavLink href="/blog">{t("navigation.blog")}</NavLink>
          </Stack>

          <Stack direction="column" className="text-sm">
            <H6 render={<strong />}>{t("navigation.collections")}:</H6>

            {collections.map(({ slug }) => (
              <NavLink key={slug} href={`/collections/${slug}`}>
                {t(`pages.collections.${slug}.name`)}
              </NavLink>
            ))}
          </Stack>

          <Stack direction="column" className="text-sm">
            <H6 render={<strong />}>{t("navigation.quick_links")}:</H6>

            <NavLink href="/submit">{t("navigation.submit")}</NavLink>
            <NavLink href="/about">{t("navigation.about")}</NavLink>
            <NavLink href="/advertise">{t("navigation.advertise")}</NavLink>
          </Stack>
        </div>
      </div>

      <BuiltWith medium="footer" className="self-start" />

      {children}
    </footer>
  )
}
