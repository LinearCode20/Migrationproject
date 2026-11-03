import { isExternalUrl } from "@dirstack/utils"
import type {
  AboutPage,
  Article,
  Blog,
  BreadcrumbList,
  FAQPage,
  Graph,
  ItemList,
  Organization,
  SoftwareApplication,
  Thing,
  WebPage,
  WebSite,
} from "schema-dts"
import { siteConfig } from "~/config/site"
import type { PostMany, PostOne } from "~/server/posts/payloads"
import type { ToolMany, ToolOne } from "~/server/tools/payloads"

interface BreadcrumbItem {
  title: string
  url: string
}

interface CollectionItem {
  name: string
  url: string
  description?: string | null
}

interface FAQItem {
  question: string
  answer: string
}

/**
 * Converts relative URL to absolute URL
 */
function toAbsoluteUrl(path: string): string {
  return isExternalUrl(path) ? path : `${siteConfig.url}${path}`
}

/**
 * Gets the organization schema reference
 */
export function getOrganization(): Organization {
  return {
    "@type": "Organization",
    "@id": `${siteConfig.url}/#/schema/organization/1`,
    name: siteConfig.name,
    url: siteConfig.url,
  }
}

/**
 * Gets the website schema reference
 */
export function getWebSite(): WebSite {
  return {
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#/schema/website/1`,
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/?q={q}`,
      query: "required name=q",
    },
  }
}

/**
 * Generates breadcrumb list schema.
 * The ID is derived from the page URL so it matches the `breadcrumb` reference on WebPage.
 * `items` is the full trail including the home crumb, so callers stay free to localize
 * its title or point it somewhere other than the site root.
 */
export function generateBreadcrumbs(url: string, items: BreadcrumbItem[]): BreadcrumbList {
  return {
    "@type": "BreadcrumbList",
    "@id": `${toAbsoluteUrl(url)}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      item: toAbsoluteUrl(item.url),
    })),
  }
}

/**
 * Generates software application schema for a tool
 */
export function generateSoftwareApplication(tool: ToolOne | ToolMany): SoftwareApplication {
  const toolUrl = toAbsoluteUrl(`/${tool.slug}`)
  const schema: SoftwareApplication = {
    "@type": "SoftwareApplication",
    "@id": `${toolUrl}#software`,
    name: tool.name,
    url: toolUrl,
    description: tool.description || tool.tagline || undefined,
    applicationCategory: "WebApplication",
    operatingSystem: "Windows, macOS, Linux, Web",
  }

  // Add screenshots, only on ToolOne.
  if ("screenshotUrl" in tool && tool.screenshotUrl) {
    schema.screenshot = {
      "@type": "ImageObject",
      url: tool.screenshotUrl,
      width: "1280",
      height: "720",
    }
  }

  // Add the logo and icon.
  if (tool.faviconUrl) {
    schema.image = tool.faviconUrl
  }

  return schema
}

/**
 * Generates item list schema
 */
export function generateItemList(items: CollectionItem[], name?: string): ItemList {
  return {
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareApplication",
        name: item.name,
        url: toAbsoluteUrl(item.url),
        description: item.description || undefined,
      },
    })),
  }
}

/**
 * Generates FAQ page schema from a list of questions and their answers
 */
export function generateFAQ(items: FAQItem[]): FAQPage {
  return {
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  }
}

/**
 * Generates article/blog posting schema
 */
export function generateArticle(url: string, post: PostOne): Article {
  return {
    "@type": "Article",
    headline: post.title,
    description: post.description || undefined,
    url: toAbsoluteUrl(url),
    datePublished: post.publishedAt?.toISOString(),
    dateModified: (post.updatedAt ?? post.publishedAt)?.toISOString(),
    publisher: getOrganization(),
    author: post.author ? { "@type": "Person", name: post.author.name } : getOrganization(),
    image: post.imageUrl
      ? {
          "@type": "ImageObject",
          url: post.imageUrl,
          width: "1200",
          height: "630",
        }
      : undefined,
    inLanguage: "en",
  }
}

export interface WebPageOptions {
  /** `@id` of the entity the page is about, e.g. a tool's SoftwareApplication node. */
  aboutId?: string
  /** Schema.org type of the page node, which keeps the page URL as its `@id` either way. */
  pageType?: "WebPage" | "CollectionPage"
}

/**
 * Generates WebPage schema
 */
export function generateWebPage(
  url: string,
  name: string,
  description?: string | null,
  { aboutId, pageType = "WebPage" }: WebPageOptions = {},
): WebPage {
  const absoluteUrl = toAbsoluteUrl(url)
  return {
    "@type": pageType,
    "@id": absoluteUrl,
    url: absoluteUrl,
    name,
    description: description || undefined,
    isPartOf: { "@id": `${siteConfig.url}/#/schema/website/1` },
    breadcrumb: { "@id": `${absoluteUrl}#breadcrumb` },
    ...(aboutId && { about: { "@id": aboutId } }),
    inLanguage: "en-US",
  }
}

/**
 * Generates blog schema (for blog listing pages)
 */
export function generateBlog(
  url: string,
  name: string,
  description: string | undefined,
  posts: PostMany[],
): Blog {
  const absoluteUrl = toAbsoluteUrl(url)
  return {
    "@type": "Blog",
    "@id": absoluteUrl,
    url: absoluteUrl,
    name,
    description,
    blogPost: posts.slice(0, 10).map(post => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description || undefined,
      url: toAbsoluteUrl(`/blog/${post.slug}`),
      datePublished: post.publishedAt?.toISOString(),
      dateModified: (post.updatedAt ?? post.publishedAt)?.toISOString(),
    })),
  }
}

/**
 * Generates about page schema
 */
export function generateAboutPage(url: string, name: string, description?: string): AboutPage {
  const absoluteUrl = toAbsoluteUrl(url)
  return {
    "@type": "AboutPage",
    "@id": `${absoluteUrl}#aboutpage`,
    url: absoluteUrl,
    name,
    description,
  }
}

/**
 * Helper to create a graph of multiple schemas
 */
export function createGraph(schemas: Thing[]): Graph {
  return {
    "@context": "https://schema.org",
    "@graph": schemas,
  }
}
