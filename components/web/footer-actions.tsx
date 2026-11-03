"use client"

import { AtSignIcon, RssIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { type SocialProvider, socials } from "~/components/common/icons/socials"
import { Stack } from "~/components/common/stack"
import { Tooltip } from "~/components/common/tooltip"
import { ExternalLink } from "~/components/web/external-link"
import { ThemeSwitcher } from "~/components/web/theme-switcher"
import { NavLink, navLinkVariants } from "~/components/web/ui/nav-link"
import { linksConfig } from "~/config/links"
import { siteConfig } from "~/config/site"

export function FooterActions(props: ComponentProps<typeof Stack>) {
  const t = useTranslations()

  return (
    <Stack {...props}>
      <ThemeSwitcher tooltip={t("navigation.toggle_theme")} render={<NavLink />} />

      <DropdownMenu modal={false}>
        <Tooltip tooltip={t("navigation.rss_feed")}>
          <DropdownMenuTrigger
            aria-label={t("navigation.rss_feed")}
            className={navLinkVariants().base()}
          >
            <RssIcon />
          </DropdownMenuTrigger>
        </Tooltip>

        <DropdownMenuContent align="start">
          {linksConfig.feeds.map(({ title, url }) => (
            <DropdownMenuItem key={url} render={<ExternalLink href={url} />}>
              {title}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip tooltip={t("navigation.contact_us")}>
        <ExternalLink
          href={`mailto:${siteConfig.email}`}
          aria-label={t("navigation.contact_us")}
          className={navLinkVariants().base()}
        >
          <AtSignIcon />
        </ExternalLink>
      </Tooltip>

      {Object.entries(linksConfig.socials).map(([provider, url]) => {
        const { icon: Icon, label } = socials[provider as SocialProvider]

        return (
          <Tooltip key={provider} tooltip={label}>
            <ExternalLink href={url} aria-label={label} className={navLinkVariants().base()}>
              <Icon />
            </ExternalLink>
          </Tooltip>
        )
      })}
    </Stack>
  )
}
