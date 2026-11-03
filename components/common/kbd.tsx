"use client"

import type { ComponentProps } from "react"
import { useIsMac } from "~/hooks/use-is-mac"
import { cva, cx, type VariantProps } from "~/lib/utils"

const kbdVariants = cva({
  base: "inline-flex not-any-pointer-fine:hidden gap-[0.15em] -my-0.5 px-[0.4em] py-[0.088em] whitespace-nowrap rounded-sm border text-xs/tight font-system font-medium",

  variants: {
    variant: {
      soft: "border-transparent bg-foreground/7.5",
      outline:
        "border-[light-dark(var(--color-foreground),var(--color-background))]/15 bg-[light-dark(var(--color-foreground),var(--color-background))]/10",
    },
  },

  defaultVariants: {
    variant: "soft",
  },
})

/** Each modifier as [Mac glyph, spoken name on a Mac, label elsewhere, spoken name elsewhere]. */
const modifiers: Record<string, [string, string, string, string]> = {
  mod: ["⌘", "Command", "Ctrl", "Control"],
  meta: ["⌘", "Command", "Win", "Windows"],
  ctrl: ["⌃", "Control", "Ctrl", "Control"],
  alt: ["⌥", "Option", "Alt", "Alt"],
  shift: ["⇧", "Shift", "⇧", "Shift"],
  enter: ["⏎", "Enter", "⏎", "Enter"],
}

interface KbdProps
  extends Omit<ComponentProps<"kbd">, "children">, VariantProps<typeof kbdVariants> {
  /** The keys of a shortcut. `mod` is ⌘ on a Mac and Ctrl elsewhere, as the hotkey matches it. */
  keys: string[]
}

export function Kbd({ keys, className, variant, ...props }: KbdProps) {
  const isMac = useIsMac()
  // A modifier spelled as a word ("Ctrl") runs into its key at the glyph spacing.
  const isSpelled =
    !isMac &&
    keys.some(key => {
      const modifier = modifiers[key.toLowerCase()]
      return modifier && modifier[0] !== modifier[2]
    })

  return (
    <kbd
      className={kbdVariants({ variant, className: cx(isSpelled && "gap-[0.35em]", className) })}
      {...props}
    >
      {keys.map(key => {
        const modifier = modifiers[key.toLowerCase()]

        if (modifier) {
          const [symbol, name] = isMac ? modifier : modifier.slice(2)

          if (symbol === name) {
            return <span key={key}>{symbol}</span>
          }

          return (
            <span key={key}>
              <span className="sr-only">{name}</span>
              <span aria-hidden="true">{symbol}</span>
            </span>
          )
        }

        return <span key={key}>{key.toUpperCase()}</span>
      })}
    </kbd>
  )
}
