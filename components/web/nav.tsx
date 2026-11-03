"use client"

import { useRender } from "@base-ui/react/use-render"
import { useHotkeys } from "@mantine/hooks"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import type { ComponentProps, ReactNode } from "react"
import { toast } from "sonner"
import { BrandBlueskyIcon } from "~/components/common/icons/brand-bluesky"
import { BrandFacebookIcon } from "~/components/common/icons/brand-facebook"
import { BrandHackerNewsIcon } from "~/components/common/icons/brand-hackernews"
import { BrandLinkedInIcon } from "~/components/common/icons/brand-linkedin"
import { BrandMastodonIcon } from "~/components/common/icons/brand-mastodon"
import { BrandRedditIcon } from "~/components/common/icons/brand-reddit"
import { BrandTelegramIcon } from "~/components/common/icons/brand-telegram"
import { BrandWhatsAppIcon } from "~/components/common/icons/brand-whatsapp"
import { BrandXIcon } from "~/components/common/icons/brand-x"
import { Kbd } from "~/components/common/kbd"
import { Note } from "~/components/common/note"
import { Tooltip } from "~/components/common/tooltip"
import { ExternalLink } from "~/components/web/external-link"
import { siteConfig } from "~/config/site"
import { useCopy } from "~/hooks/use-copy"
import { cva, cx } from "~/lib/utils"

type Platform =
  | "X"
  | "Bluesky"
  | "Mastodon"
  | "Facebook"
  | "LinkedIn"
  | "HackerNews"
  | "Reddit"
  | "Telegram"
  | "WhatsApp"

interface ShareOption {
  platform: Platform
  url: (shareUrl: string, shareTitle: string) => string
  icon: ReactNode
}

const shareOptions: ShareOption[] = [
  {
    platform: "X",
    url: (url, title) => `https://x.com/intent/post?text=${title}&url=${url}`,
    icon: <BrandXIcon />,
  },
  {
    platform: "Bluesky",
    url: (url, title) => `https://bsky.app/intent/compose?text=${title}+${url}`,
    icon: <BrandBlueskyIcon />,
  },
  {
    platform: "Mastodon",
    url: (url, title) => `https://mastodon.social/share?text=${title}+${url}`,
    icon: <BrandMastodonIcon />,
  },
  {
    platform: "Facebook",
    url: url => `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    icon: <BrandFacebookIcon />,
  },
  {
    platform: "LinkedIn",
    url: (url, title) => `https://linkedin.com/sharing/share-offsite?url=${url}&text=${title}`,
    icon: <BrandLinkedInIcon />,
  },
  {
    platform: "HackerNews",
    url: (url, title) => `https://news.ycombinator.com/submitlink?u=${url}&t=${title}`,
    icon: <BrandHackerNewsIcon />,
  },
  {
    platform: "Reddit",
    url: (url, title) => `https://reddit.com/submit?url=${url}&title=${title}`,
    icon: <BrandRedditIcon />,
  },
  {
    platform: "Telegram",
    url: (url, title) => `https://t.me/share/url?url=${url}&text=${title}`,
    icon: <BrandTelegramIcon />,
  },
  {
    platform: "WhatsApp",
    url: (url, title) => `https://api.whatsapp.com/send?text=${title}+${url}`,
    icon: <BrandWhatsAppIcon />,
  },
]

const navItemVariants = cva({
  base: "py-1 px-[5px] text-xs font-medium text-secondary-foreground rounded-sm hover:text-foreground",
})

function NavSeparator() {
  return <div className="w-px h-4 mx-1.5 bg-ring" />
}

/**
 * An action at the end of the share bar, with its own separator before it, so a page can pass
 * any number of them as children. A button by default; pass `render` for a link.
 */
export function NavAction({ className, render, ...props }: useRender.ComponentProps<"button">) {
  const action = useRender({
    render,
    defaultTagName: "button",
    props: {
      type: render ? undefined : "button",
      className: navItemVariants({ className }),
      ...props,
    },
  })

  return (
    <>
      <NavSeparator />
      {action}
    </>
  )
}

interface NavProps extends ComponentProps<"div"> {
  title: string
}

export function Nav({ children, className, title, ...props }: NavProps) {
  const t = useTranslations("tools.nav")
  const pathname = usePathname()
  const clipboard = useCopy()

  const currentUrl = encodeURIComponent(`${siteConfig.url}${pathname}`)
  const shareTitle = encodeURIComponent(`${title} – ${siteConfig.name}`)

  async function handleCopyLink() {
    if (await clipboard.copy(window.location.href)) {
      toast.success(t("link_copied"))
    }
  }

  useHotkeys([["C", handleCopyLink, { preventDefault: true }]])

  return (
    <div
      className={cx("flex flex-wrap items-center p-1 bg-background border rounded-lg", className)}
      {...props}
    >
      <button type="button" className={navItemVariants()} onClick={handleCopyLink}>
        {t("copy_link")}{" "}
        <Kbd keys={[clipboard.copied ? "✔︎" : "C"]} className="ml-0.5 max-md:hidden" />
      </button>

      <NavSeparator />

      <Note className="mx-1 text-xs font-medium max-lg:hidden">{t("share")}:</Note>

      {shareOptions.map(({ platform, url, icon }) => (
        <Tooltip key={platform} tooltip={t("share_on", { platform })}>
          <ExternalLink
            href={url(currentUrl, shareTitle)}
            eventName="click_share"
            eventProps={{ url: currentUrl, platform }}
            aria-label={t("share_on", { platform })}
            className={navItemVariants({ className: "text-base" })}
          >
            {icon}
          </ExternalLink>
        </Tooltip>
      ))}

      {children}
    </div>
  )
}
