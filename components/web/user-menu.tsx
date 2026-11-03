"use client"

import { getInitials } from "@dirstack/utils"
import { useMounted } from "@mantine/hooks"
import { useIdentify } from "highseat/react"
import { LogOutIcon, UserIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDeferredValue, ViewTransition } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/common/avatar"
import { boxVariants } from "~/components/common/box"
import { Button } from "~/components/common/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { NavLink } from "~/components/web/ui/nav-link"
import { entityIcons } from "~/config/icons"
import { signOut, useSession } from "~/lib/auth-client"
import { cx } from "~/lib/utils"
import { can } from "~/server/orpc/permissions"

export function UserMenu() {
  const { data: session, isPending } = useSession()
  const t = useTranslations()
  const router = useRouter()
  const mounted = useMounted()
  // Deferred so the skeleton→menu swap happens inside a transition, which is
  // what lets the ViewTransition below animate it (plain setState never does).
  const ready = useDeferredValue(mounted && !isPending)

  // Links the visitor's events to the signed-in user's id, never an email. `undefined` while
  // the session loads leaves the visitor as is; `null` once it is gone clears the id.
  useIdentify(isPending ? undefined : (session?.user.id ?? null))

  function handleSignOut() {
    signOut({
      fetchOptions: {
        onSuccess: () => {
          router.refresh()
          toast.success(t("forms.sign_out.success_message"))
        },
      },
    })
  }

  // Session is client-only: show the placeholder until mounted (and while it
  // resolves) so server and first client render match, then swap in the menu.
  if (!ready) {
    return (
      <Button size="sm" variant="secondary" disabled>
        {t("navigation.sign_in")}
      </Button>
    )
  }

  if (!session?.user) {
    return (
      <ViewTransition key="guest" enter="auto" default="none">
        <Button size="sm" variant="secondary" render={<Link href="/auth/login" />}>
          {t("navigation.sign_in")}
        </Button>
      </ViewTransition>
    )
  }

  return (
    <ViewTransition key="user" enter="auto" default="none">
      <DropdownMenu>
        <Avatar
          render={<DropdownMenuTrigger aria-label={t("navigation.account_menu")} />}
          className={cx(boxVariants({ interactive: true }), "size-6")}
        >
          <AvatarImage src={session.user.image ?? undefined} alt="" />
          <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
        </Avatar>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="max-w-48 truncate font-normal leading-relaxed">
              {session.user.name}

              {session.user.name !== session.user.email && (
                <div className="text-muted-foreground truncate">{session.user.email}</div>
              )}
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem render={<NavLink href="/app" prefix={<UserIcon />} />}>
            {t("navigation.dashboard")}
          </DropdownMenuItem>

          {can(session.user, "bookmarks.read") && (
            <DropdownMenuItem
              render={<NavLink href="/app/bookmarks" prefix={<entityIcons.bookmark />} />}
            >
              {t("navigation.bookmarks")}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            nativeButton
            render={<NavLink prefix={<LogOutIcon />} />}
            onClick={handleSignOut}
          >
            {t("navigation.sign_out")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ViewTransition>
  )
}
