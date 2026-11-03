import "server-only"
import { tryCatch } from "@dirstack/utils"
import type { Prisma, Tool } from "~/.generated/prisma/client"
import { generateContent } from "~/lib/ai"
import { fetchAndUploadMedia, isScreenshotOneEnabled } from "~/lib/media"
import { scrapeWebsiteData } from "~/lib/scraper"
import { patchTool } from "~/server/tools/mutations"
import { isS3Enabled } from "~/services/s3"

type EnrichableTool = Pick<
  Tool,
  "id" | "websiteUrl" | "tagline" | "description" | "content" | "faviconUrl" | "screenshotUrl"
>

type ToolMediaType = "favicon" | "screenshot"

// A screenshot has no external URL to keep, so it needs both the capture service and storage.
const canCaptureScreenshot = isScreenshotOneEnabled && isS3Enabled

/**
 * Generate a tagline, description and content from the tool's website. Returns null when the
 * website cannot be scraped or the model returns nothing.
 */
async function generateToolContent(websiteUrl: string) {
  const { data: scrapedData, error } = await tryCatch(scrapeWebsiteData(websiteUrl))

  if (error) {
    console.error(`Failed to scrape ${websiteUrl} for enrichment:`, error)
    return null
  }

  return generateContent(scrapedData)
}

/**
 * Fetch one media file for the tool and upload it to the path the admin form uses. Returns null
 * on failure.
 */
async function fetchToolMedia(tool: EnrichableTool, type: ToolMediaType) {
  const { data, error } = await tryCatch(
    fetchAndUploadMedia(tool.websiteUrl, `tools/${tool.id}/${type}`, type),
  )

  if (error) {
    console.error(`Failed to fetch the ${type} for ${tool.websiteUrl}:`, error)
    return null
  }

  return data
}

/**
 * Fill in a tool's missing copy, favicon and screenshot from its website, so a paid listing is
 * ready when an admin reviews it. Fields the tool already has are left alone: curated content
 * and media survive an upgrade, and a retried webhook does no new work. Each step fails on its
 * own, and a failure only leaves that field empty.
 */
export async function enrichTool(tool: EnrichableTool) {
  const needsCopy = !tool.tagline || !tool.description || !tool.content

  const [copy, faviconUrl, screenshotUrl] = await Promise.all([
    needsCopy ? generateToolContent(tool.websiteUrl) : null,
    tool.faviconUrl ? null : fetchToolMedia(tool, "favicon"),
    tool.screenshotUrl || !canCaptureScreenshot ? null : fetchToolMedia(tool, "screenshot"),
  ])

  const data: Prisma.ToolUncheckedUpdateInput = {
    ...(!tool.tagline && copy?.tagline && { tagline: copy.tagline }),
    ...(!tool.description && copy?.description && { description: copy.description }),
    ...(!tool.content && copy?.content && { content: copy.content }),
    ...(faviconUrl && { faviconUrl }),
    ...(screenshotUrl && { screenshotUrl }),
  }

  if (Object.keys(data).length === 0) {
    return null
  }

  return patchTool(tool.id, data)
}
