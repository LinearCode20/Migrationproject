import { BrandBlueskyIcon } from "~/components/common/icons/brand-bluesky"
import { BrandFacebookIcon } from "~/components/common/icons/brand-facebook"
import { BrandGitHubIcon } from "~/components/common/icons/brand-github"
import { BrandHackerNewsIcon } from "~/components/common/icons/brand-hackernews"
import { BrandLinkedInIcon } from "~/components/common/icons/brand-linkedin"
import { BrandMastodonIcon } from "~/components/common/icons/brand-mastodon"
import { BrandRedditIcon } from "~/components/common/icons/brand-reddit"
import { BrandTelegramIcon } from "~/components/common/icons/brand-telegram"
import { BrandWhatsAppIcon } from "~/components/common/icons/brand-whatsapp"
import { BrandXIcon } from "~/components/common/icons/brand-x"

/**
 * Single source of truth for social providers: every provider we have a brand
 * icon for maps to its icon + label here. Add a link in `linksConfig.socials`
 * (keyed by one of these) and it renders automatically in the footer.
 */
export const socials = {
  x: { icon: BrandXIcon, label: "X" },
  bluesky: { icon: BrandBlueskyIcon, label: "Bluesky" },
  mastodon: { icon: BrandMastodonIcon, label: "Mastodon" },
  github: { icon: BrandGitHubIcon, label: "GitHub" },
  linkedin: { icon: BrandLinkedInIcon, label: "LinkedIn" },
  facebook: { icon: BrandFacebookIcon, label: "Facebook" },
  reddit: { icon: BrandRedditIcon, label: "Reddit" },
  hackernews: { icon: BrandHackerNewsIcon, label: "Hacker News" },
  telegram: { icon: BrandTelegramIcon, label: "Telegram" },
  whatsapp: { icon: BrandWhatsAppIcon, label: "WhatsApp" },
} as const

export type SocialProvider = keyof typeof socials
