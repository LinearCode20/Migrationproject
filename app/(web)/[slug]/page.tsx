import { HashIcon } from "lucide-react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cache, Suspense } from "react"
import { Badge } from "~/components/common/badge"
import { H2, H5 } from "~/components/common/heading"
import { Stack } from "~/components/common/stack"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import { FeaturedToolsIcons } from "~/components/web/listings/featured-tools-icons"
import { RelatedTools, RelatedToolsSkeleton } from "~/components/web/listings/related-tools"
import { Markdown } from "~/components/web/markdown"
import { Nav } from "~/components/web/nav"
import { NewsletterCard } from "~/components/web/newsletter-card"
import { OverlayImage } from "~/components/web/overlay-image"
import { StructuredData } from "~/components/web/structured-data"
import { ToolActions } from "~/components/web/tools/tool-actions"
import { ToolButton } from "~/components/web/tools/tool-button"
import { ToolLink } from "~/components/web/tools/tool-link"
import { ToolReportLink } from "~/components/web/tools/tool-report-link"
import { ToolStatusAlert } from "~/components/web/tools/tool-status-alert"
import { ToolVerifiedBadge } from "~/components/web/tools/tool-verified-badge"
import { Backdrop } from "~/components/web/ui/backdrop"
import { Favicon } from "~/components/web/ui/favicon"
import { IntroDescription } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { Sticky } from "~/components/web/ui/sticky"
import { Tag } from "~/components/web/ui/tag"
import { adsConfig } from "~/config/ads"
import { reportsConfig } from "~/config/reports"
import { getToolOpenGraphImage } from "~/lib/opengraph"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateSoftwareApplication } from "~/lib/structured-data"
import { isToolDoFollowUrl, isToolPublished } from "~/lib/tools"
import { findTool } from "~/server/tools/queries"

type Props = PageProps<"/[slug]">

// Blocking route: data is awaited in the body so HTML ships in-order with no skeleton shell.
export const instant = false

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params
  const tool = await findTool({ where: { slug } })

  if (!tool) {
    notFound()
  }

  const t = await getTranslations()
  const url = `/${tool.slug}`
  const title = tool.tagline ? `${tool.name}: ${tool.tagline}` : tool.name
  const description = tool.description ?? ""
  const softwareApplication = generateSoftwareApplication(tool)

  const data = await getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/", title: t("navigation.tools") },
      { url, title: tool.name },
    ],
    aboutId: softwareApplication["@id"],
    structuredData: [softwareApplication],
  })

  return { tool, ...data }
})

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { tool, url, metadata } = await getData(props)

  const robots = !isToolPublished(tool) ? { index: false, follow: false } : undefined

  const openGraph = { images: getToolOpenGraphImage(tool) }

  return getPageMetadata({ url, metadata: { ...metadata, openGraph, robots } })
}

export default async function ToolPage(props: Props) {
  const { tool, metadata, structuredData } = await getData(props)
  const t = await getTranslations()

  return (
    <>
      <Section>
        <Section.Content className="max-md:contents">
          <Sticky isOverlay>
            <Stack className="@container self-stretch">
              <Favicon src={tool.faviconUrl} className="size-8" />

              <Stack className="flex-1 min-w-0">
                <H2 render={<h1 />} className="min-w-0 leading-tight! truncate">
                  {tool.name}
                </H2>

                <ToolVerifiedBadge tool={tool} size="lg" />
              </Stack>

              <Suspense>
                <ToolActions tool={tool} />
              </Suspense>

              <Backdrop />
            </Stack>
          </Sticky>

          {tool.description && (
            <IntroDescription className="-mt-fluid-md pt-4">{tool.description}</IntroDescription>
          )}

          {isToolPublished(tool) && (
            <Stack className="w-full -mt-fluid-md pt-8">
              <ToolButton tool={tool} className="md:min-w-36" />
            </Stack>
          )}

          <ToolStatusAlert tool={tool} className="self-stretch max-md:order-2" />

          {isToolPublished(tool) && tool.screenshotUrl && (
            <OverlayImage
              render={<ToolLink tool={tool} source="image" />}
              src={tool.screenshotUrl}
              alt={t("tools.screenshot_alt", { name: tool.name })}
              loading="eager"
              fetchPriority="high"
              className="self-stretch max-md:order-2"
            />
          )}

          {tool.content && (
            <Markdown
              code={tool.content}
              isDoFollowUrl={url => isToolDoFollowUrl(tool, url)}
              className="max-md:order-4"
            />
          )}

          {!!tool.categories.length && (
            <Stack direction="column" className="w-full max-md:order-5">
              <H5 render={<strong />}>{t("navigation.categories")}:</H5>

              <Stack className="gap-2">
                {tool.categories.map(({ slug, name }) => (
                  <Badge key={slug} size="lg" render={<Link href={`/categories/${slug}`} />}>
                    {name}
                  </Badge>
                ))}
              </Stack>
            </Stack>
          )}

          {!!tool.tags.length && (
            <Stack direction="column" className="w-full max-md:order-6">
              <H5 render={<h4 />}>{t("navigation.tags")}:</H5>

              <Stack>
                {tool.tags.map(tag => (
                  <Tag
                    key={tag.slug}
                    prefix={<HashIcon />}
                    render={<Link href={`/tags/${tag.slug}`} />}
                  >
                    {tag.slug}
                  </Tag>
                ))}
              </Stack>
            </Stack>
          )}

          <Stack className="w-full md:sticky md:bottom-2 md:z-10 max-md:order-7">
            <div className="absolute -inset-x-1 -bottom-3 -top-8 -z-1 pointer-events-none bg-background mask-t-from-66% max-md:hidden" />

            <Nav title={metadata.title} className="mr-auto">
              {reportsConfig.enabled && (
                <Suspense>
                  <ToolReportLink />
                </Suspense>
              )}
            </Nav>
          </Stack>
        </Section.Content>

        <Section.Sidebar className="max-md:contents">
          {adsConfig.enabled && (
            <Suspense fallback={<AdCardSkeleton className="max-md:order-3" />}>
              <AdCard className="max-md:order-3" />
            </Suspense>
          )}

          <Suspense>
            <FeaturedToolsIcons className="max-md:order-8" />
          </Suspense>

          <NewsletterCard source="tool_sidebar" className="max-md:order-9" />
        </Section.Sidebar>
      </Section>

      <Suspense fallback={<RelatedToolsSkeleton tool={tool} />}>
        <RelatedTools tool={tool} />
      </Suspense>

      <StructuredData data={structuredData} />
    </>
  )
}
