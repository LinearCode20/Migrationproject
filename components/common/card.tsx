import { useRender } from "@base-ui/react/use-render"
import type { ComponentProps } from "react"
import { boxVariants } from "~/components/common/box"
import { Stack } from "~/components/common/stack"
import { slot } from "~/lib/slot"
import { cva, cx, type VariantProps } from "~/lib/utils"

/*
 * A card that is a link or a button lifts on hover by itself. A card made clickable by a link
 * stretched over it from inside (a tool card, an ad) passes `interactive`, since the card element
 * has no `href` of its own.
 */
const cardVariants = cva({
  extend: boxVariants,
  base: [
    "group relative flex flex-col items-start gap-4 w-full border bg-card p-5 rounded-lg",
    "[&:is([href],[type])]:cursor-pointer hover:[&:is([href],[type])]:border-ring hover:[&:is([href],[type])]:bg-accent",
  ],

  variants: {
    isRevealed: {
      true: "animate-reveal transform-gpu",
    },

    isHighlighted: {
      true: "bg-yellow-500/10 hover:[&:is([href],[type])]:bg-yellow-500/15",
    },
  },

  compoundVariants: [
    {
      interactive: true,
      className: "hover:bg-accent",
    },
    {
      interactive: true,
      isHighlighted: true,
      className: "hover:bg-yellow-500/15",
    },
  ],
})

export interface CardProps
  extends useRender.ComponentProps<"div">, VariantProps<typeof cardVariants> {}

export function Card({
  className,
  interactive,
  isRevealed,
  isHighlighted,
  render,
  ...props
}: CardProps) {
  return useRender({
    render,
    defaultTagName: "div",
    props: {
      className: cardVariants({ interactive, isRevealed, isHighlighted, className }),
      ...props,
    },
  })
}

export function CardHeader({ className, ...props }: ComponentProps<typeof Stack>) {
  return <Stack className={cx("w-full", className)} {...props} />
}

export function CardFooter({ className, ...props }: ComponentProps<typeof Stack>) {
  return <Stack size="sm" className={cx("text-xs text-muted-foreground", className)} {...props} />
}

export function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx(
        "w-full line-clamp-2 text-sm/normal text-secondary-foreground text-pretty",
        className,
      )}
      {...props}
    />
  )
}

export function CardBadges({ className, size = "sm", ...props }: ComponentProps<typeof Stack>) {
  return (
    <Stack
      size={size}
      className={cx("absolute top-0 inset-x-5 z-15 -translate-y-1/2", className)}
      {...props}
    />
  )
}

export function CardBg({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx(
        "absolute -top-px -inset-x-px z-1 h-24 rounded-lg overflow-clip pointer-events-none",
        className,
      )}
      {...props}
    >
      <div className="-mt-12 size-full bg-primary/10 blur-xl rounded-full" />
    </div>
  )
}

export function CardIcon({ children, className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx(
        "absolute inset-px overflow-clip rounded-sm opacity-10 pointer-events-none",
        className,
      )}
      {...props}
    >
      {slot(children, {
        className:
          "absolute -top-20 -right-20 -z-10 size-60 rotate-12 mask-b-from-25 mask-l-from-25",
      })}
    </div>
  )
}
