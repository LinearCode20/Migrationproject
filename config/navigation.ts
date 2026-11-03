import { InfoIcon, type LucideIcon } from "lucide-react"
import { collections } from "~/config/collections"
import { entityIcons } from "~/config/icons"

/** A single navigation link. Labels are i18n keys, resolved at render. */
export interface NavEntry {
  href: string
  labelKey: string
  icon: LucideIcon
  badgeKey?: string
}

/** The promotional panel shown alongside a dropdown menu's links on desktop. */
interface NavPromo {
  href: string
  titleKey: string
  descKey: string
  ctaKey: string
}

/** A group of links, rendered as a titled section on mobile. */
export interface NavGroup {
  labelKey: string
  items: NavEntry[]
  menu?: boolean // Render as a dropdown menu on desktop instead of flat top-level links.
  eyebrowKey?: string
  promo?: NavPromo
}

/** Single source of truth for the site navigation, rendered by both the desktop and mobile menus. */
export const navigation: NavGroup[] = [
  {
    labelKey: "navigation.browse",
    items: [
      {
        href: "/",
        labelKey: "navigation.tools",
        icon: entityIcons.tool,
      },
      {
        href: "/categories",
        labelKey: "navigation.categories",
        icon: entityIcons.category,
      },
    ],
  },
  {
    labelKey: "navigation.collections",
    menu: true,
    eyebrowKey: "navigation.menu.eyebrow_collections",
    items: collections
      .filter(({ nav }) => nav)
      .map(({ slug, icon, badge }) => ({
        href: `/collections/${slug}`,
        labelKey: `pages.collections.${slug}.name`,
        icon,
        badgeKey: badge,
      })),
    promo: {
      href: "/collections",
      titleKey: "navigation.menu.promo_collections_title",
      descKey: "navigation.menu.promo_collections_description",
      ctaKey: "navigation.menu.promo_collections_cta",
    },
  },
  {
    labelKey: "navigation.resources",
    menu: true,
    eyebrowKey: "navigation.menu.eyebrow_resources",
    items: [
      {
        href: "/tags",
        labelKey: "navigation.tags",
        icon: entityIcons.tag,
      },
      {
        href: "/about",
        labelKey: "navigation.about",
        icon: InfoIcon,
      },
      {
        href: "/blog",
        labelKey: "navigation.blog",
        icon: entityIcons.blog,
      },
    ],
    promo: {
      href: "/submit",
      titleKey: "navigation.menu.promo_resources_title",
      descKey: "navigation.menu.promo_resources_description",
      ctaKey: "navigation.menu.promo_resources_cta",
    },
  },
  {
    labelKey: "navigation.advertise",
    items: [
      {
        href: "/advertise",
        labelKey: "navigation.advertise",
        icon: entityIcons.ad,
      },
    ],
  },
]
