import { formatNumber, preciseRound } from "@dirstack/utils"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { Tooltip } from "~/components/common/tooltip"
import { cx } from "~/lib/utils"

const directions = {
  up: { glyph: ArrowUpIcon, label: "Up", className: "text-success-text" },
  down: { glyph: ArrowDownIcon, label: "Down", className: "text-destructive-text" },
}

interface MetricTrendProps extends ComponentProps<"span"> {
  /** The change as a fraction: 0.06 reads "+6%". */
  change: number
  /** Shown on hover, naming what the change compares against. */
  tooltip?: ReactNode
}

/**
 * A relative change as the unsigned figure the arrow points at: "6%", "150%". From tenfold up
 * it turns into a multiplier ("12.5×", "248×"), since "24743%" is a number nobody reads. A drop
 * can't pass 100%, so it always stays a percent.
 */
function formatChange(change: number) {
  const magnitude = Math.abs(change)

  if (magnitude < 10) {
    return formatNumber(magnitude, { style: "percent", maximumFractionDigits: 0 })
  }

  return `${formatNumber(1 + magnitude, { notation: "compact", maximumFractionDigits: 1 })}×`
}

/**
 * Relative change against the previous period: an arrow for the direction and the unsigned
 * figure, green when up and red when down. A change that rounds to 0% renders nothing.
 */
export function MetricTrend({ change, tooltip, className, ...props }: MetricTrendProps) {
  // Rounded before the check, so a +0.4% move counts as no change instead of an arrow over "0%".
  const rounded = preciseRound(change)

  if (rounded === 0) {
    return
  }

  const { glyph: Glyph, label, className: tone } = rounded > 0 ? directions.up : directions.down

  return (
    <Tooltip tooltip={tooltip}>
      {/* Never wraps: the glyph carries the direction, so a line break between it and the
          figure would leave a percentage that reads as neither up nor down. */}
      <span className={cx("whitespace-nowrap font-medium", tone, className)} {...props}>
        <Glyph
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
          role="img"
          aria-label={label}
          strokeWidth={2}
          className="mr-[0.1em] inline-block size-[1em] align-[-0.15em]"
        />
        {formatChange(rounded)}
      </span>
    </Tooltip>
  )
}
