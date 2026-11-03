import { tryCatch } from "@dirstack/utils"
import wretch from "wretch"
import { env } from "~/env"
import { getCache, setCache } from "~/lib/cache"
import { withTimeout } from "~/lib/http"

export interface ScrapedData {
  title: string
  description: string
  url: string
  content: string
}

interface ScrapeOptions {
  skipCache?: boolean
}

/**
 * Scrapes a website and returns the scraped data using Jina.ai's Reader API.
 * Supports optional caching to reduce API calls for repeated requests.
 * @param url The URL of the website to scrape.
 * @param options Optional configuration including skipCache to bypass caching.
 * @returns The scraped data.
 */
export async function scrapeWebsiteData(
  url: string,
  options: ScrapeOptions = {},
): Promise<ScrapedData> {
  const { skipCache = false } = options
  const cacheKey = `scraper:website:${url}`

  // Check the cache first, unless skipCache is true.
  if (!skipCache) {
    const cachedData = await getCache<ScrapedData>(cacheKey)

    if (cachedData) {
      return cachedData
    }
  }

  let jinaApi = wretch("https://r.jina.ai").headers({
    Accept: "application/json",
    "X-Remove-Selector": "img, video, iframe, a",
    "X-Retain-Images": "none",
    "X-Return-Format": "markdown",
  })

  if (env.JINA_API_KEY) {
    jinaApi = jinaApi.auth(`Bearer ${env.JINA_API_KEY}`)
  }

  function fetchWith(engine?: string) {
    return (engine ? jinaApi.headers({ "X-Engine": engine }) : jinaApi)
      .options(withTimeout(30_000))
      .post({ url })
      .json<{ data: ScrapedData }>()
  }

  // The cf-browser-rendering engine handles JS-heavy sites, but it intermittently fails
  // with a 503 ServiceNodeResourceDrainError. Retry once on Jina's default
  // engine so a renderer outage doesn't fail the whole scrape.
  const { data, error } = await tryCatch(fetchWith("cf-browser-rendering").catch(() => fetchWith()))

  if (error) {
    throw new Error(`Failed to scrape ${url}: ${error.message}`)
  }

  // Cache the scraped data for future requests.
  await setCache(cacheKey, data.data)
  return data.data
}
