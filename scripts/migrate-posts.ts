/**
 * Migration script: MDX blog posts → Database
 *
 * Reads markdown files from `content/posts/` directory, parses frontmatter,
 * uploads local images to S3, and inserts them into the database as Post records.
 *
 * Usage:
 *   SKIP_ENV_VALIDATION=1 bun run scripts/migrate-posts.ts
 *
 * Requirements:
 *   - `content/posts/` directory with .md/.mdx files
 *   - A user in the database to assign as author (defaults to first admin)
 *   - DATABASE_URL environment variable set
 */

import { readdir, readFile } from "node:fs/promises"
import { basename, extname, join, resolve } from "node:path"
import { PostStatus } from "~/.generated/prisma/client"
import { uploadToS3Storage } from "~/lib/media"
import { db } from "~/services/db"

const POSTS_DIR = join(import.meta.dirname, "../content/posts")

interface Frontmatter {
  title: string
  description?: string
  image?: string
  publishedAt?: string
  updatedAt?: string
  author?: {
    name: string
    image?: string
    url?: string
  }
}

/**
 * Parse YAML-like frontmatter from markdown content.
 * Handles simple key-value pairs and nested objects (author).
 */
function parseFrontmatter(content: string): { data: Frontmatter; content: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)

  if (!match) {
    throw new Error("No frontmatter found")
  }

  const frontmatterStr = match[1]
  const body = content.slice(match[0].length).trim()
  const data: Record<string, unknown> = {}

  let currentObject: Record<string, string> | null = null
  let currentKey: string | null = null

  for (const line of frontmatterStr.split("\n")) {
    // Nested property, which starts with spaces.
    if (currentKey && /^\s{2,}\w/.test(line)) {
      const nestedMatch = line.match(/^\s+(\w+):\s*"?(.+?)"?\s*$/)

      if (nestedMatch) {
        if (!currentObject) {
          currentObject = {}
        }
        currentObject[nestedMatch[1]] = nestedMatch[2].replace(/^["']|["']$/g, "")
      }

      continue
    }

    // Save any accumulated nested object.
    if (currentKey && currentObject) {
      data[currentKey] = currentObject
      currentObject = null
      currentKey = null
    }

    // Top-level key-value.
    const kvMatch = line.match(/^(\w+):\s*(.*)$/)

    if (kvMatch) {
      const [, key, rawValue] = kvMatch
      const value = rawValue.replace(/^["']|["']$/g, "").trim()

      if (!value) {
        // Start of a nested object.
        currentKey = key
        currentObject = {}
      } else {
        data[key] = value
      }
    }
  }

  // Save last nested object.
  if (currentKey && currentObject) {
    data[currentKey] = currentObject
  }

  return { data: data as unknown as Frontmatter, content: body }
}

/**
 * Strip markdown formatting to produce plain text for search and read time.
 */
function stripMarkdown(text: string): string {
  return (
    text
      // Code blocks.
      .replace(/```[\s\S]*?```/g, "")
      // Inline code.
      .replace(/`([^`]+)`/g, "$1")
      // Bold.
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      // Italic.
      .replace(/(\*|_)(.*?)\1/g, "$2")
      // Links.
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Images.
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      // Strikethrough.
      .replace(/~~(.*?)~~/g, "$1")
      // HTML and JSX tags.
      .replace(/<[^>]+>/g, "")
      // Heading markers.
      .replace(/^#{1,6}\s+/gm, "")
      // List markers.
      .replace(/^[-*+]\s+/gm, "")
      // Ordered list markers.
      .replace(/^\d+\.\s+/gm, "")
      // Blockquotes.
      .replace(/^>\s+/gm, "")
      // Horizontal rules.
      .replace(/^---$/gm, "")
      // Excess newlines.
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  )
}

/**
 * Check if a path is a local file reference (not a URL).
 */
function isLocalPath(path: string): boolean {
  return !path.startsWith("http://") && !path.startsWith("https://") && !path.startsWith("//")
}

/**
 * Upload a local image file to S3 and return the URL.
 */
async function uploadLocalImage(imagePath: string, s3Key: string): Promise<string> {
  // Resolve paths starting with "/" relative to the public directory, others relative to POSTS_DIR.
  const base = imagePath.startsWith("/") ? join(import.meta.dirname, "../public") : POSTS_DIR
  const absolutePath = resolve(base, imagePath.startsWith("/") ? imagePath.slice(1) : imagePath)
  const buffer = await readFile(absolutePath)
  return uploadToS3Storage(Buffer.from(buffer), s3Key)
}

async function main() {
  console.log("Starting blog post migration...")

  // Find the admin user to assign as author.
  const admin = await db.user.findFirst({
    where: { role: "admin" },
    select: { id: true, email: true },
  })

  if (!admin) {
    console.error("No admin user found. Please create an admin user first.")
    process.exit(1)
  }

  console.log(`Using author: ${admin.email}`)

  let files: string[]

  try {
    const entries = await readdir(POSTS_DIR)
    files = entries.filter(fileName => [".md", ".mdx"].includes(extname(fileName)))
  } catch {
    console.error(`No posts directory found at: ${POSTS_DIR}`)
    console.error("Make sure content/posts/ exists with your markdown files.")
    process.exit(1)
  }

  if (files.length === 0) {
    console.log("No markdown files found in content/posts/")
    process.exit(0)
  }

  console.log(`Found ${files.length} post(s) to migrate\n`)

  let migrated = 0
  let skipped = 0

  for (const file of files) {
    const slug = basename(file, extname(file))
    const filePath = join(POSTS_DIR, file)

    const existing = await db.post.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (existing) {
      console.log(`  Skipped: "${slug}" (already exists)`)
      skipped++
      continue
    }

    const raw = await readFile(filePath, "utf-8")
    const { data, content } = parseFrontmatter(raw)

    if (!data.title) {
      console.log(`  Skipped: "${file}" (missing title)`)
      skipped++
      continue
    }

    // Generate the post ID upfront so the S3 paths can use it.
    const postId = crypto.randomUUID()

    // Upload frontmatter image to S3 if it's a local file.
    let imageUrl = data.image
    if (imageUrl && isLocalPath(imageUrl)) {
      try {
        imageUrl = await uploadLocalImage(imageUrl, `posts/${postId}/image`)
        console.log(`    Uploaded cover image: ${data.image}`)
      } catch (error) {
        console.warn(`    Warning: Failed to upload cover image "${data.image}":`, error)
        imageUrl = undefined
      }
    }

    // Upload inline markdown images to S3.
    let processedContent = content
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
    let match: RegExpExecArray | null

    while ((match = imageRegex.exec(content)) !== null) {
      const [fullMatch, , imagePath] = match

      if (isLocalPath(imagePath)) {
        try {
          const uniqueId = crypto.randomUUID().slice(0, 8)
          const s3Url = await uploadLocalImage(imagePath, `posts/${postId}/content/${uniqueId}`)
          processedContent = processedContent.replace(
            fullMatch,
            fullMatch.replace(imagePath, s3Url),
          )
          console.log(`    Uploaded inline image: ${imagePath}`)
        } catch (error) {
          console.warn(`    Warning: Failed to upload inline image "${imagePath}":`, error)
        }
      }
    }

    const plainText = stripMarkdown(processedContent)

    await db.post.create({
      data: {
        id: postId,
        title: data.title,
        slug,
        description: data.description,
        content: processedContent,
        plainText,
        imageUrl,
        status: PostStatus.Published,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
        authorId: admin.id,
      },
    })

    console.log(`  Migrated: "${data.title}"`)
    migrated++
  }

  console.log(`\nMigration complete: ${migrated} migrated, ${skipped} skipped`)
}

main()
  .catch(error => {
    console.error("Migration failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
