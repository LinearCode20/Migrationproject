import { type CSSProperties, Suspense } from "react"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import { adsConfig, getAdOrder } from "~/config/ads"
import { paginationConfig } from "~/config/pagination"

interface AdGridProps {
  count: number
}

export function AdGrid({ count }: AdGridProps) {
  // Gate here, not just in AdCard: an ungated Suspense still flushes empty skeletons.
  if (!adsConfig.enabled) {
    return null
  }

  return Array.from({ length: adsConfig.adsPerPage }, (_, index) => {
    const orders = [1, 2, 3].map(columnCount =>
      getAdOrder(index, columnCount, paginationConfig.toolsPerPage),
    )

    if (Math.min(...orders) > count) {
      return null
    }

    // Skeleton carries the ad's order so it reserves the exact slot; otherwise the
    // resolved ad jumps into a mid-grid slot and shifts every tool below it (CLS).
    const style = {
      "--order-1": orders[0],
      "--order-2": orders[1],
      "--order-3": orders[2],
    } as CSSProperties
    const className = "order-(--order-1) sm:order-(--order-2) lg:order-(--order-3)"

    return (
      <Suspense
        key={`ad-${index}`}
        fallback={<AdCardSkeleton style={style} className={className} />}
      >
        <AdCard grid isRevealed style={style} className={className} />
      </Suspense>
    )
  })
}
