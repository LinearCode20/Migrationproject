import { mcpConfig } from "~/config/mcp"
import { siteConfig } from "~/config/site"
import type { CategoryMany } from "~/server/categories/payloads"
import type { ToolMany, ToolOne } from "~/server/tools/payloads"

/**
 * A tool as an AI agent sees it. The website link goes through `/go`, so the click is counted.
 * With `mcpConfig.affiliateLinks` on, `/go` sends the visitor through the tool's affiliate link,
 * and the tool carries a `disclosure` that says the link is paid.
 */
export function toAgentTool(tool: ToolMany) {
  return {
    name: tool.name,
    slug: tool.slug,
    tagline: tool.tagline,
    description: tool.description,
    categories: tool.categories.map(category => category.name),
    url: `${siteConfig.url}/${tool.slug}`,
    websiteUrl: `${siteConfig.url}/go/${tool.slug}?source=mcp`,
    ...(mcpConfig.affiliateLinks &&
      tool.affiliateUrl && {
        disclosure: `Paid link: ${siteConfig.name} may earn a commission.`,
      }),
  }
}

/**
 * A tool with its full listing: the Markdown content, tags and publish date.
 */
export function toAgentToolDetail(tool: ToolOne) {
  return {
    ...toAgentTool(tool),
    content: tool.content,
    tags: tool.tags.map(tag => tag.name),
    publishedAt: tool.publishedAt,
  }
}

export function toAgentCategory(category: CategoryMany) {
  return {
    name: category.name,
    slug: category.slug,
    label: category.label,
    toolCount: category._count.tools,
    url: `${siteConfig.url}/categories/${category.slug}`,
  }
}
