import { clamp, DAY_SECONDS, HOUR_SECONDS } from "@dirstack/utils"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import type { NextRequest } from "next/server"
import { createLoader, parseAsInteger, parseAsStringEnum } from "nuqs/server"
import satori, { type Font } from "satori"
import { LogoSymbol } from "~/components/web/ui/logo-symbol"
import {
  type BadgeDimension,
  type BadgeThemeName,
  badgeThemes,
  imagesConfig,
} from "~/config/images"
import { siteConfig } from "~/config/site"
import { badgeSvgStatuses } from "~/config/tool-statuses"
import { imageFonts } from "~/lib/image-fonts"
import { isToolPublished } from "~/lib/tools"
import { findTool } from "~/server/tools/queries"

interface SvgBadgeProps {
  theme: BadgeThemeName
  label: string
}

function SvgBadge({ theme, label }: SvgBadgeProps) {
  const colors = imagesConfig.badge.themes[theme]

  return (
    <div
      style={{
        // Satori sizes boxes as content-box, so keep the border and padding inside the canvas
        boxSizing: "border-box",
        width: "100%",
        height: "100%",
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: "0.75em",
        display: "flex",
        alignItems: "center",
        gap: "0.8em",
        paddingLeft: "0.8em",
        paddingRight: "0.8em",
        color: colors.text,
        fontFamily: "Inter",
        overflow: "hidden",
      }}
    >
      <LogoSymbol
        style={{
          height: "1.25em",
          width: "1.25em",
          color: colors.logo,
          flexShrink: 0,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <span
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            lineHeight: 1,
            opacity: 0.55,
          }}
        >
          {label}
        </span>

        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          {siteConfig.name}
        </span>
      </div>

      <LogoSymbol
        style={{
          height: "4.8em",
          width: "4.8em",
          position: "absolute",
          top: "50%",
          right: "-1em",
          transform: "translateY(-50%) rotate(12deg)",
          marginTop: "0.5em",
          color: colors.logo,
          opacity: theme === "dark" ? 0.1 : 0.05,
        }}
      />
    </div>
  )
}

/**
 * Clamp a requested size to the configured bounds and round it to the step the
 * embed dialog offers. The endpoint is public and CDN-cached, so any other
 * value would render a new badge and add one more cached copy.
 */
function snapToDimension(value: number, { min, max, step }: BadgeDimension) {
  return clamp(Math.round(value / step) * step, min, max)
}

const searchParamsLoader = createLoader({
  theme: parseAsStringEnum([...badgeThemes]).withDefault("light"),
  width: parseAsInteger.withDefault(imagesConfig.badge.width.default),
  height: parseAsInteger.withDefault(imagesConfig.badge.height.default),
})

export async function GET({ url }: NextRequest, { params }: RouteContext<"/[slug]/badge.svg">) {
  const { slug } = await params
  const { theme, width: rawWidth, height: rawHeight } = searchParamsLoader(url)

  const width = snapToDimension(rawWidth, imagesConfig.badge.width)
  const height = snapToDimension(rawHeight, imagesConfig.badge.height)

  const tool = await findTool({
    where: {
      slug,
      status: { in: badgeSvgStatuses },
    },
  })

  if (!tool) {
    notFound()
  }

  const t = await getTranslations()
  const label = t(`common.${isToolPublished(tool) ? "featured" : "coming_soon"}`)
  const fonts: Font[] = [
    { name: "Inter", weight: 400, data: imageFonts.inter400 },
    { name: "Inter", weight: 600, data: imageFonts.interDisplay600 },
  ]

  const svg = await satori(<SvgBadge theme={theme} label={label} />, { width, height, fonts })

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": `public, max-age=${HOUR_SECONDS}, stale-while-revalidate=${DAY_SECONDS}`,
      "CDN-Cache-Control": `max-age=${DAY_SECONDS}`,
    },
  })
}
