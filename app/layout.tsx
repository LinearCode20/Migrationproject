import "./styles.css"
import "@fontsource-variable/inter/opsz.css"
import type { Metadata, Viewport } from "next"
import { getTranslations } from "next-intl/server"
import { Providers } from "~/components/providers"
import { metadataConfig } from "~/config/metadata"
import { siteConfig } from "~/config/site"
import { getPageOpenGraphImage } from "~/lib/opengraph"

// A maximum scale of 1 stops iOS Safari zooming in on a focused field under 16px.
// Pinch zoom still works, since iOS ignores the cap for user gestures.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations()

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      template: `%s – ${siteConfig.name}`,
      default: `${t("brand.tagline")} – ${siteConfig.name}`,
    },
    description: t("brand.description"),
    icons: { icon: [{ type: "image/png", url: "/favicon.png" }] },
    ...metadataConfig,
    openGraph: { ...metadataConfig.openGraph, images: await getPageOpenGraphImage("home") },
  }
}

export default function ({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className="scroll-smooth"
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground font-sans tracking-normal">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
