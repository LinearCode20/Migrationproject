"use client"

import { getDomain, isTruthy } from "@dirstack/utils"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  BadgeCheckIcon,
  BookmarkIcon,
  ChevronDownIcon,
  CodeXmlIcon,
  CreditCardIcon,
  EllipsisIcon,
  SparklesIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryState } from "nuqs"
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react"
import { toast } from "sonner"
import { Button } from "~/components/common/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { Stack } from "~/components/common/stack"
import { Tooltip } from "~/components/common/tooltip"
import { LoginDialog } from "~/components/web/auth/login-dialog"
import { ToolEmbedDialog } from "~/components/web/dialogs/tool-embed-dialog"
import { ToolReportDialog } from "~/components/web/dialogs/tool-report-dialog"
import { ToolVerifyDialog } from "~/components/web/dialogs/tool-verify-dialog"
import { ToolButton } from "~/components/web/tools/tool-button"
import { reportsConfig } from "~/config/reports"
import { useAuthCallbackUrl } from "~/hooks/use-auth-callback-url"
import { useToolAccess } from "~/hooks/use-tool-access"
import { useToolDialog } from "~/hooks/use-tool-dialog"
import { useSession } from "~/lib/auth-client"
import { orpc } from "~/lib/orpc-query"
import { hasToolTierCap, isToolEmbeddable, isToolPublished, isUserOnDomain } from "~/lib/tools"
import { cx } from "~/lib/utils"
import type { ToolOne } from "~/server/tools/payloads"

interface ToolActionsProps extends ComponentProps<typeof Stack> {
  tool: ToolOne
}

interface ListingAction {
  label: string
  tooltip: string
  icon: ReactNode
  href?: string
  isHighlighted?: boolean
  isPending?: boolean
  onClick?: () => void
}

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true })
  return () => window.removeEventListener("scroll", onChange)
}

export function ToolActions({ tool, children, className, ...props }: ToolActionsProps) {
  const t = useTranslations("tools.actions")
  const { data: session } = useSession()
  const router = useRouter()
  const [dialog, setDialog] = useToolDialog()
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  // A bookmark clicked while signed out is kept in the callback URL as `?bookmark=<slug>`,
  // because the magic link can open in another tab or on another device.
  const [pendingBookmark, setPendingBookmark] = useQueryState("bookmark")
  const bookmarkCallbackURL = useAuthCallbackUrl({ bookmark: tool.slug })

  // A boolean snapshot, so only threshold crossings re-render, not every scroll frame.
  const isStickyButtonVisible = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 250,
    () => false,
  )

  const { canManage, canUpgrade, canManageBilling } = useToolAccess(tool.id)
  const canVerify = !tool.verifiedAt
  // A signed-in user on the tool's email domain is most likely its maker.
  const isLikelyMaker = canVerify && isUserOnDomain(session?.user, tool.websiteUrl)
  // The gold badge reads as verified already, so only the owner and makers see Verify beside it.
  const isVerifyVisible =
    canVerify && (canManage || isLikelyMaker || !hasToolTierCap(tool, "goldVerified"))
  const canEmbed = canManage && isToolEmbeddable(tool)

  const { mutate: openBillingPortal, isPending: isBillingPending } = useMutation(
    orpc.products.createBillingPortal.mutationOptions({
      onSuccess: ({ url }) => {
        window.location.assign(url)
      },
      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const bookmarkQuery = orpc.bookmarks.check.queryOptions({
    input: { toolId: tool.id },
    enabled: !!session?.user,
    initialData: { bookmarked: false },
    initialDataUpdatedAt: 0,
  })

  const { data: bookmarkData } = useQuery(bookmarkQuery)

  const { mutateAsync: toggleBookmark } = useMutation(
    orpc.bookmarks.set.mutationOptions({
      onMutate: async ({ bookmarked }, { client }) => {
        const queryKey = bookmarkQuery.queryKey

        await client.cancelQueries({ queryKey })

        const previousData = client.getQueryData(queryKey)

        client.setQueryData(queryKey, old => (old ? { ...old, bookmarked } : old))

        return { previousData, queryKey }
      },
      onError: (_error, _variables, onMutateResult, { client }) => {
        if (onMutateResult) {
          client.setQueryData(onMutateResult.queryKey, onMutateResult.previousData)
        }
      },
      onSettled: (_data, _error, _variables, _onMutateResult, { client }) => {
        client.invalidateQueries({ queryKey: orpc.bookmarks.key() })
      },
    }),
  )

  function setBookmark(bookmarked: boolean) {
    toast.promise(toggleBookmark({ toolId: tool.id, bookmarked }), {
      loading: bookmarked ? t("bookmark_adding") : t("bookmark_removing"),
      success: {
        message: bookmarked ? t("bookmark_added") : t("bookmark_removed"),
        action: {
          label: t("bookmark_view"),
          onClick: () => router.push("/app/bookmarks"),
        },
      },
      error: error => error.message,
    })
  }

  function handleBookmarkClick() {
    if (!session?.user) {
      setShowLoginDialog(true)
      return
    }

    setBookmark(!bookmarkData.bookmarked)
  }

  useEffect(() => {
    if (!session?.user || pendingBookmark !== tool.slug) {
      return
    }

    // Saving is idempotent, so a repeated run cannot toggle the bookmark back off.
    void setPendingBookmark(null)
    setBookmark(true)
  }, [session?.user, pendingBookmark, tool.slug])

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      setDialog(null)
    }
  }

  // The owner already manages the listing, so verifying only adds the badge. Anyone else
  // verifies to show the listing is theirs.
  const verifyAction = isVerifyVisible && {
    label: canManage ? t("verify_badge_button") : t("verify_button"),
    tooltip: canManage
      ? t("verify_badge_tooltip", { domain: getDomain(tool.websiteUrl) })
      : t("verify_tooltip"),
    icon: <BadgeCheckIcon />,
    isHighlighted: true,
    onClick: () => setDialog("verify"),
  }

  // Listing actions in revenue order, except that a likely maker sees Verify first. The first
  // is a button of its own, and the rest open from a chevron beside it, so the header holds at
  // most one labelled button for them.
  const listingActions: ListingAction[] = [
    isLikelyMaker && verifyAction,
    canUpgrade && {
      label: t("upgrade_button"),
      tooltip: t("upgrade_tooltip"),
      icon: <SparklesIcon />,
      href: `/submit/${tool.slug}`,
      isHighlighted: true,
    },
    canManageBilling && {
      label: t("billing_button"),
      tooltip: t("billing_tooltip"),
      icon: <CreditCardIcon />,
      isPending: isBillingPending,
      onClick: () => openBillingPortal({ toolId: tool.id }),
    },
    !isLikelyMaker && verifyAction,
    canEmbed && {
      label: t("embed_button"),
      tooltip: t("embed_tooltip"),
      icon: <CodeXmlIcon />,
      onClick: () => setDialog("embed"),
    },
  ].filter(isTruthy)

  const [primaryAction, ...secondaryActions] = listingActions

  function renderActionItem({ label, icon, href, isPending, onClick }: ListingAction) {
    return (
      <DropdownMenuItem
        key={label}
        render={href ? <Link href={href} /> : undefined}
        disabled={isPending}
        onClick={onClick}
      >
        {icon}
        {label}
      </DropdownMenuItem>
    )
  }

  return (
    <Stack size="sm" wrap={false} className={cx("justify-end", className)} {...props}>
      {/* Always mounted so the scroll toggle stays an interruptible CSS
          transition. The slot fold and the button fade are sequenced to never
          overlap: layout motion shows through a partially-faded button. The
          stack gap is cancelled by -mr-2 and re-created as pr-2 so the folded
          slot occupies exactly zero width. */}
      {isToolPublished(tool) && (
        <div
          className={cx(
            "order-first max-md:hidden -mr-2 grid transition-[grid-template-columns]",
            isStickyButtonVisible
              ? "grid-cols-[1fr] duration-150 ease-[cubic-bezier(0.2,0,0,1)]"
              : "grid-cols-[0fr] duration-0 delay-150",
          )}
        >
          <div
            inert={!isStickyButtonVisible}
            className={cx(
              "flex min-w-0 justify-end pr-2 transition-opacity",
              isStickyButtonVisible
                ? "animate-slide-in delay-150 duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                : "opacity-0 duration-150 ease-in pointer-events-none",
            )}
          >
            <ToolButton tool={tool} size="md" className="shrink-0">
              <span className="@max-sm:sr-only">{t("visit_button")}</span>
            </ToolButton>
          </div>
        </div>
      )}

      <DropdownMenu modal={false}>
        <Button
          size="md"
          variant="secondary"
          prefix={<EllipsisIcon />}
          render={<DropdownMenuTrigger />}
          className="@2xl:hidden"
        >
          <span className="@max-lg:sr-only">{t("actions_button")}</span>
        </Button>

        <DropdownMenuContent align="end">
          <DropdownMenuItem closeOnClick={!session?.user} onClick={handleBookmarkClick}>
            <BookmarkIcon className={cx(bookmarkData.bookmarked && "fill-current")} />
            {bookmarkData.bookmarked ? t("bookmark_saved") : t("bookmark_save")}
          </DropdownMenuItem>

          {listingActions.length > 0 && <DropdownMenuSeparator />}

          {listingActions.map(renderActionItem)}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Not a `ButtonGroup`: its corner rules use `:first-of-type`, which a link beside a
          button doesn't match, so the joined corners are set here. */}
      {primaryAction && (
        <div className="flex @max-2xl:hidden">
          <Tooltip tooltip={primaryAction.tooltip}>
            <Button
              size="md"
              variant="secondary"
              prefix={primaryAction.icon}
              isPending={primaryAction.isPending}
              render={primaryAction.href ? <Link href={primaryAction.href} /> : undefined}
              className={cx(
                primaryAction.isHighlighted && "text-primary",
                secondaryActions.length > 0 && "rounded-r-none",
              )}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          </Tooltip>

          {secondaryActions.length > 0 && (
            <DropdownMenu modal={false}>
              <Button
                size="md"
                variant="secondary"
                prefix={<ChevronDownIcon />}
                isPending={secondaryActions.some(({ isPending }) => isPending)}
                aria-label={t("more_listing_actions")}
                render={<DropdownMenuTrigger />}
                className="-ml-px rounded-l-none"
              />

              <DropdownMenuContent align="end">
                {secondaryActions.map(renderActionItem)}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <Tooltip tooltip={bookmarkData.bookmarked ? t("bookmark_remove") : t("bookmark_add")}>
        <Button
          size="md"
          variant="secondary"
          prefix={<BookmarkIcon />}
          className={cx("@max-2xl:hidden", bookmarkData.bookmarked && "text-primary")}
          onClick={handleBookmarkClick}
        >
          {bookmarkData.bookmarked ? t("bookmark_saved") : t("bookmark_save")}
        </Button>
      </Tooltip>

      {children}

      {reportsConfig.enabled && (
        <ToolReportDialog
          tool={tool}
          open={dialog === "report"}
          onOpenChange={handleDialogOpenChange}
        />
      )}

      {canEmbed && (
        <ToolEmbedDialog
          tool={tool}
          open={dialog === "embed"}
          onOpenChange={handleDialogOpenChange}
        />
      )}

      {canVerify && (
        <ToolVerifyDialog
          tool={tool}
          isOwner={canManage}
          open={dialog === "verify"}
          onOpenChange={handleDialogOpenChange}
        />
      )}

      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        description={t("bookmark_sign_in", { toolName: tool.name })}
        callbackURL={bookmarkCallbackURL}
      />
    </Stack>
  )
}
