import { useRender } from "@base-ui/react/use-render"
import { getHotkeyHandler } from "@mantine/hooks"
import { type ComponentProps, type ReactElement, type ReactNode, useState } from "react"
import { Button } from "~/components/common/button"
import {
  AlertDialog,
  AlertDialogTrigger,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/common/dialog"
import { Kbd } from "~/components/common/kbd"

interface ConfirmDialogProps {
  /** The element that opens the dialog. */
  children: ReactElement
  title?: ReactNode
  description: ReactNode
  confirmLabel: ReactNode
  variant?: ComponentProps<typeof Button>["variant"]

  /**
   * Runs when the user confirms. The dialog closes once the returned promise
   * resolves and stays open when it rejects, so the caller reports the error.
   */
  onConfirm: () => unknown
}

export function ConfirmDialog({
  children,
  title = "Are you sure?",
  description,
  confirmLabel,
  variant = "primary",
  onConfirm,
}: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  function handleConfirm() {
    // The button disables itself while pending, the hotkey has to opt in too.
    if (isPending) {
      return
    }

    setIsPending(true)

    Promise.resolve(onConfirm())
      .then(() => setIsOpen(false))
      .catch(() => {})
      .finally(() => setIsPending(false))
  }

  const handleKeyDown = getHotkeyHandler([
    [
      "mod+Enter",
      event => {
        event.stopPropagation()
        handleConfirm()
      },
    ],
  ])

  const trigger = useRender({
    render: children,
    props: {
      nativeButton: true,
      render: <AlertDialogTrigger />,
    },
  })

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger}

      <DialogContent size="md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose
            render={<Button size="md" variant="secondary" suffix={<Kbd keys={["esc"]} />} />}
          >
            Cancel
          </DialogClose>

          <Button
            size="md"
            variant={variant}
            aria-label={typeof confirmLabel === "string" ? confirmLabel : undefined}
            suffix={<Kbd variant="outline" keys={["mod", "enter"]} />}
            isPending={isPending}
            className="min-w-28"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </AlertDialog>
  )
}
