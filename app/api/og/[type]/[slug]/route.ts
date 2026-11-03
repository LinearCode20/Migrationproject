import { ImageResponse } from "next/og"
import { type NextRequest, NextResponse } from "next/server"
import { openGraphCardTypes, type OpenGraphCardType } from "~/lib/opengraph"
import { openGraphCardLoaders, openGraphRenderer } from "~/lib/opengraph-cards"

function isCardType(type: string): type is OpenGraphCardType {
  return openGraphCardTypes.includes(type as OpenGraphCardType)
}

/**
 * Renders the Open Graph card for one entity, loaded by type and slug. The `v`
 * query is the card's version: a request for the current URL is cached for a
 * year. A stale or missing version, or any other query parameter, redirects to
 * the current URL, so an edit, a made-up version or a cache-busting parameter
 * never renders or caches a second copy.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/og/[type]/[slug]">) {
  const { type, slug } = await params
  const loaded = isCardType(type) ? await openGraphCardLoaders[type](slug) : undefined

  if (!loaded) {
    return new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } })
  }

  const current = new URL(loaded.image.url)

  if (request.nextUrl.search !== current.search) {
    return NextResponse.redirect(current, {
      status: 307,
      headers: { "Cache-Control": "public, max-age=300" },
    })
  }

  const { element, fonts, width, height } = await openGraphRenderer.renderElement(loaded.card)

  return new ImageResponse(element, {
    width,
    height,
    fonts,
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  })
}
