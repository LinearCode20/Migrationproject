import { slugify } from "@dirstack/utils"
import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import { Children } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prose } from "~/components/common/prose"
import { ExternalLink } from "~/components/web/external-link"

interface Heading {
  id: string
  text: string
  level: number
}

const fencePattern = /^ {0,3}(`{3,}|~{3,})(.*)$/
const headingPattern = /^ {0,3}(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/

/**
 * Builds a heading anchor id. The extractor and the renderer both number every
 * heading (h1 to h6) in document order, so they must share this helper.
 */
function slugifyHeading(text: string, index: number) {
  return `${slugify(text)}-${index}`
}

/** Reduces images, links, bold, italic and inline code to their visible text. */
function stripInlineMarkdown(text: string) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .replace(/_([^_]*)_/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .trim()
}

/**
 * Lists the h1 to h3 headings of a markdown document for a table of contents.
 * Lines inside fenced code blocks are skipped, matching what the renderer turns
 * into headings.
 */
export function extractHeadingsFromMarkdown(md: string): Heading[] {
  const headings: Heading[] = []
  let openFence: string | null = null
  let headingIndex = 0

  for (const line of md.split(/\r?\n/)) {
    const [, fence, fenceInfo] = line.match(fencePattern) ?? []

    if (openFence) {
      // A closing fence carries no info string.
      if (fence?.[0] === openFence[0] && fence.length >= openFence.length && !fenceInfo?.trim()) {
        openFence = null
      }

      continue
    }

    if (fence) {
      openFence = fence
      continue
    }

    const match = line.match(headingPattern)

    if (!match) {
      continue
    }

    const level = match[1].length
    const text = stripInlineMarkdown(match[2])
    const id = slugifyHeading(text, headingIndex++)

    if (level <= 3) {
      headings.push({ id, text, level })
    }
  }

  return headings
}

function extractTextFromChildren(children: ReactNode): string {
  const childArray = Children.toArray(children)
  return childArray
    .map(child => {
      if (typeof child === "string") {
        return child
      }
      if (typeof child === "number") {
        return String(child)
      }
      if (typeof child === "object" && child !== null && "props" in child) {
        return extractTextFromChildren(
          (child as { props: { children?: ReactNode } }).props.children,
        )
      }
      return ""
    })
    .join("")
}

function createHeadingComponent(
  Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
  nextIndex: () => number,
) {
  return ({ children }: ComponentProps<"h1">) => {
    const text = extractTextFromChildren(children)
    const id = slugifyHeading(text, nextIndex())
    return <Tag id={id}>{children}</Tag>
  }
}

function createComponents({ isDoFollowUrl }: Required<Pick<MarkdownProps, "isDoFollowUrl">>) {
  let headingIndex = 0
  function nextIndex() {
    return headingIndex++
  }

  return {
    a: ({ children, href }: ComponentProps<"a">) => {
      // Only same-site paths and anchors are internal. A protocol-relative `//host`, or `/\host`
      // which browsers read the same way, points off-site and goes through `ExternalLink`.
      if (href && /^(#|\/(?![/\\]))/.test(href)) {
        return <Link href={href}>{children}</Link>
      }

      return (
        <ExternalLink href={href} doTrack doFollow={!!href && isDoFollowUrl(href)}>
          {children}
        </ExternalLink>
      )
    },

    img: ({ src, alt }: ComponentProps<"img">) => (
      <img src={src} alt={alt} loading="lazy" className="w-full rounded-lg" />
    ),

    table: (props: ComponentProps<"table">) => (
      <div className="overflow-x-auto">
        <table {...props} />
      </div>
    ),

    h1: createHeadingComponent("h1", nextIndex),
    h2: createHeadingComponent("h2", nextIndex),
    h3: createHeadingComponent("h3", nextIndex),
    h4: createHeadingComponent("h4", nextIndex),
    h5: createHeadingComponent("h5", nextIndex),
    h6: createHeadingComponent("h6", nextIndex),
  }
}

interface MarkdownProps extends ComponentProps<typeof Prose> {
  code: string
  /** Decides which external links pass link equity. Every external link does by default. */
  isDoFollowUrl?: (url: string) => boolean
}

export function Markdown({ code, isDoFollowUrl = () => true, ...props }: MarkdownProps) {
  const components = createComponents({ isDoFollowUrl })

  return (
    <Prose {...props}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {code}
      </ReactMarkdown>
    </Prose>
  )
}
