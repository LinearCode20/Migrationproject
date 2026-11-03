import "server-only"
import { getFormatter, getTranslations } from "next-intl/server"
import { type Card, createRenderer, type IconRef } from "ogier/lite"
import { LogoSymbol } from "~/components/web/ui/logo-symbol"
import { imagesConfig } from "~/config/images"
import { siteConfig } from "~/config/site"
import { getS3PublicUrl } from "~/env"
import { withTimeout } from "~/lib/http"
import { imageFonts } from "~/lib/image-fonts"
import {
  type CategoryCardData,
  getCategoryCardData,
  getCategoryOpenGraphImage,
  getPageCardData,
  getPageOpenGraphImage,
  getPostCardData,
  getPostOpenGraphImage,
  getToolCardData,
  getToolOpenGraphImage,
  type OpenGraphCardType,
  type OpenGraphImage,
  type PageCardData,
  type PostCardData,
  type ToolCardData,
} from "~/lib/opengraph"
import { findCategory } from "~/server/categories/queries"
import { findPost } from "~/server/posts/queries"
import { findTool } from "~/server/tools/queries"

const inter = [
  { data: imageFonts.inter400, weight: 400 },
  { data: imageFonts.inter500, weight: 500 },
]

/**
 * One renderer for every card, so ogier turns the fonts into satori's format
 * once per server instance, on the first render. Titles take Inter Display, as
 * the site's headings do, and every other text takes Inter in the weight ogier
 * sets for it: Medium for the header, eyebrow and footer, Regular for the
 * description and, by the brand's Open Graph guide, the byline. The sizes
 * follow the same guide.
 */
export const openGraphRenderer = createRenderer({
  theme: imagesConfig.openGraph.theme,
  fonts: { title: [{ data: imageFonts.interDisplay600, weight: 600 }], body: inter, label: inter },
  background: { pattern: "dots" },
  sizes: {
    cardPadding: { top: 72, right: 80, bottom: 64, left: 80 },
    contentWidth: 760,
    headerIcon: 30,
    headerText: 30,
    headerGap: 12,
    headerTracking: "-0.01em",
    iconSize: 88,
    iconRadius: 8,
    eyebrowText: 18,
    eyebrowTracking: "0.08em",
    titleText: 64,
    titleTextLong: 52,
    titleTextLongest: 44,
    titleWeight: 600,
    titleWeightLong: 600,
    titleLineHeight: 1.1,
    titleTracking: "-0.02em",
    titleTrackingLong: "-0.02em",
    bylineText: 28,
    bylineWeight: 400,
    descriptionText: 28,
    descriptionLineHeight: 1.4,
    footerText: 22,
  },
})

/** The header and footer every card shares: the logo, and the page's address. */
function getFrame(path = "") {
  return {
    header: { text: siteConfig.name, icon: { element: <LogoSymbol /> } },
    footer: { text: `${siteConfig.domain}${path}` },
  } satisfies Card
}

const faviconMaxBytes = 1024 * 1024

/**
 * Fetch a stored favicon as an icon for a card. Favicons load only from the S3
 * bucket they are stored in, over https, with a timeout and no redirects, so a
 * card never fetches an arbitrary host or hangs on a slow one. Stored favicons
 * are PNG or SVG; anything else, an error or a slow response renders without
 * the icon.
 * @param url - The favicon URL saved on the entity
 */
async function fetchFavicon(url: string | null): Promise<IconRef | undefined> {
  if (!url || !URL.canParse(url)) {
    return
  }

  const { protocol, origin } = new URL(url)

  if (protocol !== "https:" || origin !== new URL(getS3PublicUrl()).origin) {
    return
  }

  try {
    const response = await fetch(url, { ...withTimeout(3000), redirect: "error" })
    const type = response.headers.get("content-type")?.split(";")[0]
    const length = Number(response.headers.get("content-length") ?? 0)

    if (!response.ok || length > faviconMaxBytes) {
      return
    }

    const data = new Uint8Array(await response.arrayBuffer())

    if (type === "image/svg+xml") {
      return { svg: data }
    }

    if (type === "image/png" || type === "image/jpeg") {
      return { data, type }
    }
  } catch (error) {
    console.error(`Open Graph favicon failed to load: ${url}`, error)
  }
}

// The builders below draw only from the card data in `~/lib/opengraph`, which
// is also what the image URL's version hashes.

/** The Default card: a page's title and description, with the site's address. */
function getPageCard({ title, description }: PageCardData): Card {
  return { ...getFrame(), title, description }
}

/** A tool's favicon, name and tagline, with its page address. */
async function getToolCard({ slug, name, text, faviconUrl }: ToolCardData): Promise<Card> {
  return {
    ...getFrame(`/${slug}`),
    icon: await fetchFavicon(faviconUrl),
    title: name,
    description: text ?? undefined,
  }
}

/** A category's title and description, with its tool count as the eyebrow. */
async function getCategoryCard(data: CategoryCardData): Promise<Card> {
  const t = await getTranslations()
  const count = t("tools.count_tools", { count: data.toolCount })

  return {
    ...getFrame(`/categories/${data.slug}`),
    eyebrow: `${t("categories.category")} · ${count}`,
    title: data.title,
    description: data.description ?? undefined,
  }
}

/** A blog post's title and author, with its publish date beside the address. */
async function getPostCard({ title, author, publishedAt }: PostCardData): Promise<Card> {
  const t = await getTranslations()
  const format = await getFormatter()
  const frame = getFrame("/blog")
  const date = publishedAt && format.dateTime(new Date(publishedAt), { dateStyle: "medium" })

  return {
    ...frame,
    footer: { text: date ? `${frame.footer.text} · ${date}` : frame.footer.text },
    eyebrow: t("navigation.blog"),
    title,
    byline: author ?? undefined,
  }
}

interface LoadedCard {
  card: Card
  image: OpenGraphImage
}

/** The site's own card, or a page's title and description from the messages. */
async function loadPageCard(key: string): Promise<LoadedCard | undefined> {
  const data = await getPageCardData(key)

  if (!data) {
    return
  }

  return { card: getPageCard(data), image: await getPageOpenGraphImage(key) }
}

async function loadToolCard(slug: string): Promise<LoadedCard | undefined> {
  const tool = await findTool({ where: { slug } })

  if (!tool) {
    return
  }

  return { card: await getToolCard(getToolCardData(tool)), image: getToolOpenGraphImage(tool) }
}

async function loadCategoryCard(slug: string): Promise<LoadedCard | undefined> {
  const category = await findCategory({ where: { slug } })

  if (!category) {
    return
  }

  const card = await getCategoryCard(await getCategoryCardData(category))
  return { card, image: await getCategoryOpenGraphImage(category) }
}

async function loadPostCard(slug: string): Promise<LoadedCard | undefined> {
  const post = await findPost({ where: { slug } })

  if (!post) {
    return
  }

  return { card: await getPostCard(getPostCardData(post)), image: getPostOpenGraphImage(post) }
}

/** The loader behind each card type: the data comes from the database by slug, never from the URL. */
export const openGraphCardLoaders: Record<
  OpenGraphCardType,
  (slug: string) => Promise<LoadedCard | undefined>
> = {
  page: loadPageCard,
  tool: loadToolCard,
  category: loadCategoryCard,
  post: loadPostCard,
}
