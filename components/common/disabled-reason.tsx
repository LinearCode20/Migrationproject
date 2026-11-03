"use client"

import { cloneElement, type MouseEvent, type ReactElement, useId } from "react"
import { Tooltip } from "~/components/common/tooltip"

interface DisabledReasonProps {
  /** Why the control cannot run. Left empty, the control renders as it is. */
  reason?: string | false | null
  children: ReactElement<{ "aria-describedby"?: string }>
}

/**
 * Keeps a control that cannot run in place and says why. The control takes `aria-disabled`
 * instead of `disabled`, so it still takes focus and the pointer: a screen reader reads the
 * reason through `aria-describedby`, and a pointer gets it in a tooltip. A click (or the Enter
 * or Space that becomes one) does nothing while the reason stands, a link included.
 */
export function DisabledReason({ reason, children }: DisabledReasonProps) {
  const id = useId()

  if (!reason) {
    return children
  }

  const describedBy = [children.props["aria-describedby"], id].filter(Boolean).join(" ")

  return (
    <>
      <Tooltip tooltip={reason}>
        {cloneElement(children, {
          disabled: false,
          "aria-disabled": true,
          "aria-describedby": describedBy,
          onClick: (event: MouseEvent & { preventBaseUIHandler?: () => void }) => {
            // Base UI triggers (a popover, a dialog) run their own handler after this one.
            event.preventDefault()
            event.preventBaseUIHandler?.()
          },
        } as Record<string, unknown>)}
      </Tooltip>

      <span id={id} hidden>
        {reason}
      </span>
    </>
  )
}
