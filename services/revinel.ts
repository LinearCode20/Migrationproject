import "server-only"
// Augments the ad.meta type. The side-effect import keeps the augmentation referenced.
import "~/types/revinel"
import {
  createRevinelClient,
  type RevinelAd,
  type RevinelPlacementListOptions,
  type RevinelPlacementOptions,
} from "@revinel/sdk"
import { getTranslations } from "next-intl/server"
import { connection } from "next/server"
import { cache } from "react"
import { adsConfig } from "~/config/ads"
import { siteConfig } from "~/config/site"
import { env } from "~/env"

// Server client hits Revinel directly; the /_proxy/revinel rewrite would self-loop at build.
const revinel = createRevinelClient({
  workspaceId: env.NEXT_PUBLIC_REVINEL_WORKSPACE_ID ?? "",
  apiUrl: env.NEXT_PUBLIC_REVINEL_API_URL,
})

async function failSafe<T>(request: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await request()
  } catch (error) {
    // Rethrow Next control-flow errors (digest); swallowing them breaks static marking.
    if (error instanceof Error && "digest" in error) {
      throw error
    }
    console.error("Revinel request failed:", error)
    return fallback
  }
}

// `id` is the site slug (not a Revinel ad id), so its tracking calls 404 harmlessly.
async function getHouseAd(): Promise<RevinelAd> {
  const t = await getTranslations("ads")

  return {
    id: siteConfig.slug,
    name: t("default_ad.name"),
    websiteUrl: `${siteConfig.url}/advertise`,
    faviconUrl: "/favicon.png",
    weight: 0,
    meta: {
      description: t("default_ad.description"),
      shortDescription: t("default_ad.short_description"),
      buttonLabel: t("default_ad.button_label", { siteName: siteConfig.name }),
    },
  }
}

interface FetchAdOptions extends RevinelPlacementOptions {
  premium?: boolean
  fallback?: boolean
}

export async function fetchAd({
  premium = false,
  fallback = true,
  weight,
  ...options
}: FetchAdOptions = {}) {
  if (!adsConfig.enabled) {
    return null
  }

  // Request-time; opt out of the static shell so an ad is never prebaked.
  await connection()

  const effectiveWeight = premium ? { gte: adsConfig.premiumWeightThreshold } : weight
  const ad = await failSafe(() => revinel.getAd({ ...options, weight: effectiveWeight }), null)

  return ad ?? (fallback ? await getHouseAd() : null)
}

async function fetchAds({ count = 50, ...options }: RevinelPlacementListOptions = {}) {
  if (!adsConfig.enabled) {
    return []
  }

  await connection()

  return failSafe(() => revinel.getAds({ ...options, count }), [])
}

// Request-scoped pool: over-fetch and cycle so a second grid keeps serving distinct ads.
const getGridAdPool = cache(async () => {
  const ads = await fetchAds({ count: adsConfig.adsPerPage * 3 })
  const pool = ads.length ? ads : [await getHouseAd()]
  let slot = 0

  return () => pool[slot++ % pool.length]!
})

export async function takeGridAd() {
  if (!adsConfig.enabled) {
    return null
  }

  const take = await getGridAdPool()

  return take()
}
