"use client"

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { H4 } from "~/components/common/heading"
import { Prose } from "~/components/common/prose"
import { cva, cx, type VariantProps } from "~/lib/utils"

export function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

export function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

/**
 * A dialog that asks for a decision, such as confirming a delete: announced as an `alertdialog`,
 * and a press outside does not dismiss it. It takes the same `DialogContent` and parts.
 */
export function AlertDialog(props: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

export function AlertDialogTrigger(props: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}

function DialogPortal(props: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

export function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

/**
 * Dialogs enter over 200ms on `ease-out-expo` and leave over 150ms on `ease-out`. The backdrop
 * uses the same timing, so it appears and disappears with the panel.
 */
const dialogAnimationClasses = [
  "data-open:duration-200 data-open:animate-in data-open:ease-out-expo",
  "data-closed:duration-150 data-closed:animate-out data-closed:ease-out",
]

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cx(
        "fixed inset-x-0 top-0 h-lvh z-50 bg-scrim",
        dialogAnimationClasses,
        "data-open:fade-in-0 data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  )
}

const dialogContentVariants = cva({
  base: [
    "relative max-h-full w-full grid gap-4 border bg-background p-4 rounded-md shadow-modal overflow-y-auto overscroll-contain sm:p-6 sm:rounded-lg",
    dialogAnimationClasses,
    "data-open:fade-in-0 data-closed:fade-out-0",
    "data-open:zoom-in-98 data-closed:zoom-out-98",
    "data-open:slide-in-from-bottom-4 data-closed:slide-out-to-bottom-4",
  ],

  variants: {
    size: {
      xs: "max-w-xs",
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
    },
  },

  defaultVariants: {
    size: "lg",
  },
})

interface DialogContentProps
  extends DialogPrimitive.Popup.Props, VariantProps<typeof dialogContentVariants> {}

export function DialogContent({ className, children, size, ...props }: DialogContentProps) {
  const t = useTranslations("common")

  return (
    <DialogPortal>
      <DialogOverlay />

      <div className="fixed inset-0 z-50 flex h-screen items-start justify-center px-4 py-6 sm:pt-[12.5vh] sm:[@media(min-height:1000px)]:pt-[25vh]">
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className={cx(dialogContentVariants({ size }), className)}
          {...props}
        >
          {children}

          <DialogPrimitive.Close
            data-slot="dialog-close"
            aria-label={t("close")}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none"
          >
            <XIcon aria-hidden="true" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Popup>
      </div>
    </DialogPortal>
  )
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cx("flex flex-col gap-2 text-start", className)}
      {...props}
    />
  )
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cx(
        "flex flex-col-reverse gap-2 -m-4 mt-0 px-4 py-3 border-t md:flex-row md:justify-between sm:-m-6 sm:mt-0 sm:px-6 sm:py-4 sm:sticky sm:-bottom-6 sm:bg-background",
        className,
      )}
      {...props}
    />
  )
}

export function DialogTitle(props: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title data-slot="dialog-title" render={<H4 />} {...props} />
}

export function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      render={<Prose />}
      className={cx("text-sm/normal", className)}
      {...props}
    />
  )
}
