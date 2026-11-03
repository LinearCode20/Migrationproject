import { createHash } from "node:crypto"
import { getTranslations } from "next-intl/server"
import { imagesConfig } from "~/config/images"
import { siteConfig } from "~/config/site"
import type { PostOne } from "~/server/posts/payloads"
import type { ToolOne } from "~/server/tools/payloads"

/** The card kinds `/api/og/[type]/[slug]` renders, each keyed by a slug it loads itself. */
export const openGraphCardTypes = ["page", "tool", "category", "post"] as const

export type OpenGraphCardType = (typeof openGraphCardTypes)[number]

const openGraphImageSize = { width: 1200, height: 630 }

/**
 * A short hash of what a card shows, used as the `v` query of its image URL.
 * The URL changes exactly when the card's content or `imagesConfig.openGraph.revision`
 * changes, so the image can be cached for a year and still update on edit,
 * while edits the card does not show keep the cached image.
 * @param data - Everything the card is drawn from
 */
function getOpenGraphVersion(data: unknown) {
  const input = JSON.stringify([imagesConfig.openGraph.revision, data])
  return createHash("sha256").update(input).digest("base64url").slice(0, 8)
}

interface OpenGraphImageProps {
  type: OpenGraphCardType
  slug: string
  data: unknown
  alt: string
}

/**
 * The `og:image` entry for a card, with its size and alt text.
 * @param data - Everything the card is drawn from, hashed into the URL's version
 */
function getOpenGraphImage({ type, slug, data, alt }: OpenGraphImageProps) {
  const version = getOpenGraphVersion(data)

  return {
    url: `${siteConfig.url}/api/og/${type}/${encodeURIComponent(slug)}?v=${version}`,
    ...openGraphImageSize,
    alt,
    type: "image/png",
  }
}

export type OpenGraphImage = ReturnType<typeof getOpenGraphImage>

// Each card type has one function that picks what its card shows. The page
// metadata hashes that data into the image URL, and the route draws the card
// from the same data, so a field cannot reach the card without the version.

/**
 * The `pages.<namespace>` messages that have a card of their own. Only these
 * render, since other namespaces hold patterns such as `{name} tools` that need
 * an entity. A page missing from the list shares the `home` card.
 */
const pageCardKeys = [
  "about",
  "advertise",
  "auth.login",
  "auth.verify",
  "blog",
  "categories",
  "collections",
  "submit",
  "tags",
]

/**
 * What a page's Default card shows, read from the messages. `home` is the
 * site's own card; any other key is a namespace under `pages`.
 * @param key - `home`, or a `pages.<key>` namespace such as `about` or `auth.login`
 * @returns The card data, or `undefined` when the key has no card
 */
export async function getPageCardData(key: string) {
  const t = await getTranslations()

  if (key === "home") {
    return { title: t("brand.tagline"), description: t("brand.description") }
  }

  if (!pageCardKeys.includes(key)) {
    return
  }

  return {
    title: t(`pages.${key}.title`),
    description: t(`pages.${key}.description`, { siteName: siteConfig.name }),
  }
}

export type PageCardData = NonNullable<Awaited<ReturnType<typeof getPageCardData>>>

/**
 * The `og:image` entry for a page's Default card.
 * @param key - Same as {@link getPageCardData}
 */
export async function getPageOpenGraphImage(key: string): Promise<OpenGraphImage> {
  const data = await getPageCardData(key)

  if (!data) {
    return getPageOpenGraphImage("home")
  }

  return getOpenGraphImage({ type: "page", slug: key, data, alt: data.title })
}

type ToolCardSource = Pick<ToolOne, "slug" | "name" | "tagline" | "description" | "faviconUrl">

/**
 * What a tool's card shows: its favicon, name and tagline, or its description
 * when it has no tagline. A new favicon is stored under a new `?v=` URL, so
 * replacing it changes the version too.
 */
export function getToolCardData({ slug, name, tagline, description, faviconUrl }: ToolCardSource) {
  return { slug, name, text: tagline ?? description, faviconUrl }
}

export type ToolCardData = ReturnType<typeof getToolCardData>

/** The `og:image` entry for a tool's card. */
export function getToolOpenGraphImage(tool: ToolCardSource) {
  const data = getToolCardData(tool)
  const alt = tool.tagline ? `${tool.name}: ${tool.tagline}` : tool.name

  return getOpenGraphImage({ type: "tool", slug: tool.slug, data, alt })
}

interface CategoryCardSource {
  slug: string
  name: string
  label: string | null
  description: string | null
  _count: { tools: number }
}

/**
 * The title of a category's page and card: its own label, or the name in the
 * `pages.category.title` pattern.
 */
export async function getCategoryTitle({
  name,
  label,
}: Pick<CategoryCardSource, "name" | "label">) {
  const t = await getTranslations("pages.category")
  return label || t("title", { name })
}

/** What a category's card shows: its title, description and tool count. */
export async function getCategoryCardData(category: CategoryCardSource) {
  const { slug, description, _count } = category
  const title = await getCategoryTitle(category)

  return { slug, title, description, toolCount: _count.tools }
}

export type CategoryCardData = Awaited<ReturnType<typeof getCategoryCardData>>

/** The `og:image` entry for a category's card. */
export async function getCategoryOpenGraphImage(category: CategoryCardSource) {
  const data = await getCategoryCardData(category)
  return getOpenGraphImage({ type: "category", slug: category.slug, data, alt: data.title })
}

type PostCardSource = Pick<PostOne, "slug" | "title" | "publishedAt" | "author">

/** What a blog post's card shows: its title, author and publish date. */
export function getPostCardData({ title, publishedAt, author }: PostCardSource) {
  return {
    title,
    author: author?.name ?? null,
    publishedAt: publishedAt?.toISOString() ?? null,
  }
}

export type PostCardData = ReturnType<typeof getPostCardData>

/** The `og:image` entry for a blog post's card. */
export function getPostOpenGraphImage(post: PostCardSource) {
  const data = getPostCardData(post)
  return getOpenGraphImage({ type: "post", slug: post.slug, data, alt: post.title })
}
