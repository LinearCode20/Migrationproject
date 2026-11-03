import { getCurrentPage } from "@dirstack/utils"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import type { Thing } from "schema-dts"
import { metadataConfig } from "~/config/metadata"
import { siteConfig } from "~/config/site"
import { getPageOpenGraphImage } from "~/lib/opengraph"
import {
  createGraph,
  generateBreadcrumbs,
  generateWebPage,
  getOrganization,
  getWebSite,
  type WebPageOptions,
} from "~/lib/structured-data"

interface DataOptions extends WebPageOptions {
  metadata?: Metadata
  breadcrumbs?: { url: string; title: string }[]
  structuredData?: Thing[]
}

/**
 * Creates page metadata, breadcrumbs, and structured data for a page
 * @param url - The URL of the page
 * @param title - The title of the page
 * @param description - The description of the page
 * @param options - Optional metadata, breadcrumbs, structured data, and WebPage node options
 */
export async function getPageData(
  url: string,
  title: string,
  description: string,
  options?: DataOptions,
) {
  const t = await getTranslations("navigation")
  const metadata = { ...options?.metadata, title, description }
  const breadcrumbs = options?.breadcrumbs ?? []

  // The home crumb belongs to the JSON-LD trail only: the visual `Breadcrumbs`
  // prepends its own home icon, so the returned `breadcrumbs` must stay without one.
  const crumbs = [{ url: siteConfig.url, title: t("home") }, ...breadcrumbs]

  const structuredData = createGraph([
    getOrganization(),
    getWebSite(),
    generateWebPage(url, title, description, options),
    generateBreadcrumbs(url, crumbs),
    ...(options?.structuredData ?? []),
  ])

  return { url, metadata, breadcrumbs, structuredData }
}

/**
 * Page data for a page whose title and description live in the
 * `pages.<namespace>` messages. The description receives `siteName`, and the
 * breadcrumbs default to a single crumb for the page itself.
 * @param namespace - The message namespace under `pages`, e.g. `"about"` or `"auth.login"`
 * @param url - The URL of the page
 * @param options - Same options as {@link getPageData}
 */
export async function getNamespacePageData(namespace: string, url: string, options?: DataOptions) {
  const t = await getTranslations()
  const title = t(`pages.${namespace}.title`)
  const description = t(`pages.${namespace}.description`, { siteName: siteConfig.name })

  const metadata = {
    ...options?.metadata,
    openGraph: { images: await getPageOpenGraphImage(namespace) },
  }

  return getPageData(url, title, description, {
    ...options,
    metadata,
    breadcrumbs: options?.breadcrumbs ?? [{ url, title }],
  })
}

interface GetPageMetadataProps {
  url: string
  metadata?: Metadata
  searchParams?: { page?: string | string[] }
}

/**
 * Get the metadata for a page. A page without its own `openGraph.images`
 * shares the site's Default card.
 * @param url - The URL of the page
 * @param metadata - The metadata for the page
 * @param searchParams - The page's search params
 */
export async function getPageMetadata({ url, metadata, searchParams }: GetPageMetadataProps) {
  const { alternates, ...rest } = { ...metadataConfig, ...metadata }
  const openGraph = { ...metadataConfig.openGraph, ...metadata?.openGraph }
  const images = metadata?.openGraph?.images ?? (await getPageOpenGraphImage("home"))

  const pageParam = Array.isArray(searchParams?.page) ? searchParams.page[0] : searchParams?.page
  const page = getCurrentPage(pageParam)
  const canonical = page > 1 ? `${url}?page=${page}` : url

  return {
    ...rest,
    alternates: { ...alternates, canonical },
    openGraph: { ...openGraph, url: canonical, images },
  }
}
