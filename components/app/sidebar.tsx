"use client"

import { useMediaQuery } from "@mantine/hooks"
import { DockIcon, ExternalLinkIcon, LogOutIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Nav, type NavLink } from "~/components/app/nav"
import { Kbd } from "~/components/common/kbd"
import { LogoSymbol } from "~/components/web/ui/logo-symbol"
import { entityIcons } from "~/config/icons"
import { siteConfig } from "~/config/site"
import { useSearch } from "~/contexts/search-context"
import { useUser } from "~/contexts/user-context"
import { signOut } from "~/lib/auth-client"
import type { SessionUser } from "~/server/orpc/context"
import { can } from "~/server/orpc/permissions"
import type { Permission } from "~/server/orpc/roles"

// A nav entry plus an optional permission gate. Items without a `permission`
// are shown to every signed-in user; admin (`*`) sees everything.
interface NavItem extends NavLink {
  permission?: Permission
}

/**
 * Filter out items the user lacks permission for, strip the `permission`
 * field (so it never reaches the DOM), and collapse the separators that would
 * otherwise be left dangling: leading, trailing, or consecutive.
 */
function buildVisibleLinks(items: (NavItem | undefined)[], user: SessionUser | null) {
  const links = items
    .filter(item => !item || !item.permission || can(user, item.permission))
    .reduce<(NavLink | undefined)[]>((result, item) => {
      if (!item) {
        // Separator: keep only when it follows a real item (skips leading + double).
        if (result.length && result.at(-1) !== undefined) {
          result.push(undefined)
        }
        return result
      }

      const { permission: _permission, ...link } = item
      result.push(link)
      return result
    }, [])

  // Drop a trailing separator left after the last group was filtered away.
  if (links.at(-1) === undefined) {
    links.pop()
  }

  return links
}

export function Sidebar() {
  const user = useUser()
  // Below `md` the rail shows icons only, so their names move into tooltips.
  const isCollapsed = useMediaQuery("(width < 48rem)")
  const router = useRouter()
  const search = useSearch()

  function handleSignOut() {
    signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("You've been signed out successfully")
          router.push("/")
        },
      },
    })
  }

  // `undefined` entries are group separators.
  const items: (NavItem | undefined)[] = [
    {
      title: "Dashboard",
      href: "/app",
      prefix: <LogoSymbol />,
    },

    undefined,
    {
      title: "Tools",
      href: "/app/tools",
      prefix: <entityIcons.tool />,
      permission: "tools.manage",
    },
    {
      title: "Categories",
      href: "/app/categories",
      prefix: <entityIcons.category />,
      permission: "categories.read",
    },
    {
      title: "Tags",
      href: "/app/tags",
      prefix: <entityIcons.tag />,
      permission: "tags.read",
    },
    {
      title: "Blog Posts",
      href: "/app/posts",
      prefix: <entityIcons.blog />,
      permission: "posts.read",
    },

    undefined,
    {
      title: "Users",
      href: "/app/users",
      prefix: <entityIcons.user />,
      permission: "users.read",
    },
    {
      title: "Reports",
      href: "/app/reports",
      prefix: <entityIcons.report />,
      permission: "reports.read",
    },

    undefined,
    {
      title: "Bookmarks",
      href: "/app/bookmarks",
      prefix: <entityIcons.bookmark />,
      permission: "bookmarks.read",
    },

    undefined,
    {
      title: "Quick Menu",
      onClick: search.open,
      prefix: <DockIcon />,
      suffix: <Kbd keys={["mod", "K"]} />,
    },
    {
      title: "Visit Site",
      href: siteConfig.url,
      prefix: <ExternalLinkIcon />,
    },
    {
      title: "Logout",
      onClick: handleSignOut,
      prefix: <LogOutIcon />,
    },
  ]

  return (
    <Nav
      isCollapsed={isCollapsed}
      links={buildVisibleLinks(items, user)}
      className="sticky top-0 h-dvh z-40 border-r w-12 md:w-48"
    />
  )
}
