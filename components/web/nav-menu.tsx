"use client"

import { NavigationMenu } from "@base-ui/react/navigation-menu"
import { ArrowRightIcon, ChevronDownIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import type { ComponentProps } from "react"
import { Badge } from "~/components/common/badge"
import { ActiveNavLink, WithActive } from "~/components/web/ui/active-nav-link"
import { Eyebrow } from "~/components/web/ui/eyebrow"
import { type NavEntry, type NavGroup, navigation } from "~/config/navigation"
import { cva, cx } from "~/lib/utils"

const navMenu = cva({
  slots: {
    base: "max-lg:hidden",
    list: "flex items-center gap-x-4 text-sm",
    trigger:
      "group flex items-center gap-1 select-none py-1 text-muted-foreground transition-colors hover:text-foreground data-popup-open:text-foreground",
    triggerIcon: "-mr-1 transition-transform duration-200 group-data-popup-open:-rotate-180",
    // Two-column panel that cross-fades with a 16px slide in Base UI's activation direction.
    // The short slide signals the panel change without reading as a jump. The transition
    // lists `translate` explicitly: Tailwind v4 treats it as its own property, so
    // `transition-transform` alone would not animate the slide.
    content:
      "flex h-full w-[28rem] transition-[opacity,transform,translate] duration-200 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:data-[activation-direction=left]:-translate-x-4 data-starting-style:data-[activation-direction=right]:translate-x-4 data-ending-style:data-[activation-direction=left]:translate-x-4 data-ending-style:data-[activation-direction=right]:-translate-x-4",
    listColumn: "flex flex-1 flex-col p-1",
    eyebrow: "px-2 pt-1.5 pb-0.5",
    item: "group/i flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:text-foreground",
    // Slightly subdued at rest, brightening with the label on hover and focus.
    itemIcon:
      "size-4 shrink-0 opacity-75 transition-opacity group-hover/i:opacity-100 group-focus-visible/i:opacity-100",
    itemLabel: "flex-1",
    promo:
      "group/p flex w-[42%] flex-col items-start justify-between gap-6 border-l bg-muted/40 p-4 transition-colors hover:bg-muted",
    promoHeader: "flex flex-col gap-1.5",
    promoTitle: "text-sm font-medium text-foreground",
    promoDescription: "text-pretty text-xs/normal text-muted-foreground",
    promoCta: "flex items-center gap-1 text-xs/normal font-medium text-primary",
    promoIcon: "size-3.5 transition-transform group-hover/p:translate-x-0.5",
    // The morph lives on the positioner: Base UI feeds it --positioner-width/height and moves
    // it via top/left/right/bottom, so it must be sized by those vars and transition position+size.
    positioner:
      "z-50 outline-none h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom,width,height] duration-200 ease-out-quint",
    // Popup fills the (animating) positioner; it only owns the enter/exit scale + fade.
    popup:
      "relative h-full w-full origin-(--transform-origin) overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-popup outline-hidden transition-[opacity,transform,scale,translate] duration-200 ease-out-quint data-starting-style:-translate-y-1 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:-translate-y-1 data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-[250ms] data-ending-style:ease-out",
    viewport: "relative h-full w-full overflow-hidden",
  },
})

const styles = navMenu()

/** Dropdown menu link that highlights the current route via the shared `WithActive` guard. */
function NavMenuLink({ href, labelKey, icon: Icon, badgeKey }: NavEntry) {
  const t = useTranslations()

  return (
    <WithActive href={href}>
      {isActive => (
        <NavigationMenu.Link
          render={<Link href={href} />}
          closeOnClick
          className={cx(styles.item(), isActive && "text-foreground")}
        >
          <Icon className={styles.itemIcon()} />
          <span className={styles.itemLabel()}>{t(labelKey)}</span>
          {badgeKey && <Badge size="sm">{t(badgeKey)}</Badge>}
        </NavigationMenu.Link>
      )}
    </WithActive>
  )
}

function NavPanel({ labelKey, eyebrowKey, items, promo }: NavGroup) {
  const t = useTranslations()

  return (
    <NavigationMenu.Item value={labelKey}>
      <NavigationMenu.Trigger className={styles.trigger()}>
        {t(labelKey)}
        <NavigationMenu.Icon className={styles.triggerIcon()}>
          <ChevronDownIcon className="size-4 opacity-60" />
        </NavigationMenu.Icon>
      </NavigationMenu.Trigger>

      <NavigationMenu.Content className={cx(styles.content(), !promo && "w-48")}>
        <div className={styles.listColumn()}>
          {eyebrowKey && <Eyebrow className={styles.eyebrow()}>{t(eyebrowKey)}</Eyebrow>}

          {items.map(item => (
            <NavMenuLink key={item.href} {...item} />
          ))}
        </div>

        {promo && (
          <NavigationMenu.Link
            render={<Link href={promo.href} />}
            closeOnClick
            className={styles.promo()}
          >
            <span className={styles.promoHeader()}>
              <span className={styles.promoTitle()}>{t(promo.titleKey)}</span>
              <span className={styles.promoDescription()}>{t(promo.descKey)}</span>
            </span>

            <span className={styles.promoCta()}>
              {t(promo.ctaKey)}
              <ArrowRightIcon className={styles.promoIcon()} />
            </span>
          </NavigationMenu.Link>
        )}
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  )
}

/**
 * Prerenders into the static shell with no request data. The active-route
 * highlight is mount-guarded (`ActiveNavLink` and `NavMenuLink` read the pathname
 * only after hydration via `WithActive`), so it needs no Suspense boundary.
 * `closeOnClick` collapses the panel on navigation.
 * See https://dirstarter.com/docs/codebase/caching.
 */
export function NavMenu({ className, ...props }: ComponentProps<typeof NavigationMenu.Root>) {
  const t = useTranslations()

  return (
    <NavigationMenu.Root className={cx(styles.base(), className)} {...props}>
      <NavigationMenu.List className={styles.list()}>
        {navigation.flatMap(group => {
          if (group.menu) {
            return <NavPanel key={group.labelKey} {...group} />
          }

          // Non-menu groups flatten to plain top-level links on desktop.
          return group.items.map(({ href, labelKey }) => (
            <NavigationMenu.Item key={href}>
              <ActiveNavLink href={href}>{t(labelKey)}</ActiveNavLink>
            </NavigationMenu.Item>
          ))
        })}
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner
          sideOffset={8}
          align="start"
          collisionPadding={16}
          className={styles.positioner()}
        >
          <NavigationMenu.Popup className={styles.popup()}>
            <NavigationMenu.Viewport className={styles.viewport()} />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  )
}
