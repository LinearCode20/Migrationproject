"use client"

import { PreviewCard } from "@base-ui/react/preview-card"
import { cx, popoverAnimationClasses, popupSurfaceClasses } from "~/lib/utils"

export function HoverCard(props: PreviewCard.Root.Props) {
  return <PreviewCard.Root data-slot="hover-card" {...props} />
}

export function HoverCardTrigger(props: PreviewCard.Trigger.Props) {
  return <PreviewCard.Trigger data-slot="hover-card-trigger" {...props} />
}

export function HoverCardContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: PreviewCard.Popup.Props & Pick<PreviewCard.Positioner.Props, "align" | "sideOffset">) {
  return (
    <PreviewCard.Portal>
      <PreviewCard.Positioner align={align} sideOffset={sideOffset} className="isolate z-50">
        <PreviewCard.Popup
          data-slot="hover-card-content"
          className={cx(popupSurfaceClasses, "w-72 p-4", popoverAnimationClasses, className)}
          {...props}
        />
      </PreviewCard.Positioner>
    </PreviewCard.Portal>
  )
}
