import { generateText, Output } from "ai"
import type { z } from "zod"
import { siteConfig } from "~/config/site"
import type { ScrapedData } from "~/lib/scraper"
import { contentSchema, descriptionSchema } from "~/server/ai/schema"
import { getChatModel } from "~/services/ai"

interface GenerateOptions {
  signal?: AbortSignal
  instructions?: string
}

// Editor-supplied steering text. Kept clearly separated from source data and
// labelled as a preference so the model treats it as guidance, not as facts to
// state. The system prompt rules still win on conflicts.
function buildInstructionsBlock(instructions?: string) {
  return instructions?.trim()
    ? `\n\nAdditional instructions from the editor (follow these unless they conflict with the rules above):\n${instructions.trim()}`
    : ""
}

// Per-call ceiling so a hung provider can't stall a request. Every call site
// also disables retries.
export const AI_REQUEST_TIMEOUT_MS = 60_000

// Current Claude models reject custom sampling settings, so effort is the only
// tuning knob. Low effort writes listing copy as accurately as higher effort at
// about half the latency and cost.
const CONTENT_REASONING = "low"

const BANNED_PHRASES = [
  "delve",
  "leverage",
  "seamless",
  "robust",
  "navigate",
  "dive into",
  "embark on",
  "tapestry",
  "realm",
  "landscape (as metaphor)",
  "ever-evolving",
  "game-changer",
  "in today's fast-paced world",
  "it's important to note",
  "on the other hand",
  "in conclusion",
  "whether you're a",
  "unleash",
  "unlock",
  "empower",
  "streamline",
  "supercharge",
  "revolutionize",
  "cutting-edge",
  "state-of-the-art",
  "world-class",
  "best-in-class",
  "comprehensive solution",
  "elevate",
  "transform",
  "it's not X, it's Y",
  "not X but Y",
  "more than just X",
].join(", ")

const CONTENT_SYSTEM_PROMPT = `
You write for ${siteConfig.name}, a directory website.

Voice: write for someone deciding whether the tool fits their needs, not someone already using it. Clear, direct, plain language. No hype. Use contractions where natural (it's, don't, you're).

Audience rule: Describe what the tool is, who it's for, and what makes it worth choosing. Stay at the level a prospective user cares about. Skip step-by-step instructions, internal mechanics, and operational minutiae (how to install, configure, or run it; raw specs; option lists; jargon that only matters once you've already committed). High-level traits are fine when they're part of the value proposition, never as a how-to.

Banned phrases (never use these, they read as AI-generated):
${BANNED_PHRASES}.

Banned structures:
- No closing sentence that summarizes, reflects, generalizes, or delivers a takeaway. End on a concrete claim, not a moral. No "In a world of X, Y matters" aphorisms.
- No rhetorical questions.
- No "whether you're X or Y" openers.
- No symmetric three-tool lists everywhere. Vary structure.
- Sentence length must vary. Mix short sentences (3-6 words) with longer ones. Include at least one sentence under 6 words.

Em-dash rule: Do not use em-dashes (—). Use a period, comma, or parentheses instead. Em-dashes are a recognizable AI tell. The only exception is when grammar genuinely requires one, which is almost never in this context.

Length rule: Aim for around 1500 characters (hard cap 2000). Get there through substance, not filler. Cover the tool in depth: what it does and the problem it solves, who it's for, its main features and capabilities, what sets it apart from competitors, and any notable approach, architecture, or technology that's a genuine selling point. Treat these as a menu of what to cover, not a fixed outline. Lead with what's most distinctive about this specific tool and skip dimensions that don't apply, so descriptions don't all follow the same shape. Don't repeat a point, restate the tagline, or add generic or hype sentences to reach length. If the tool is genuinely minimal and the source has little to say, a shorter entry is fine, but never invent detail to fill space.

Formatting rule: Make it scannable. Open with a short paragraph on what the tool does and who it's for. When the tool has several distinct features, capabilities, or integrations, present them as a Markdown bullet list (each tool a tight phrase led by a **bold** term) instead of burying them in prose. Bold the key terms a skimming reader should catch. Keep paragraphs to 2-4 sentences, separated by a blank line; never return one wall of text. No headings (these are short descriptions, not docs). Don't force a list when prose flows better, or prose when a list is clearer. Let the structure fit each tool so entries don't all read alike.

Timelessness rule: Describe what the tool does as stable, current behavior, never as news. Don't tie a feature to a specific release or frame it as recent ("the latest release adds X", "new in 3.5.1", "recently added", "now supports", "in that update"). Treat release notes and changelogs as a source of what the tool can do, not of what just changed. Drop version numbers when describing capabilities, and skip roadmap, beta, or "coming soon" claims. The description should still read true after several more releases.

Factual constraint: Only state facts derivable from the input. Don't invent features, pricing, integrations, or capabilities.
`.trim()

function buildContentPrompt(data: ScrapedData) {
  return `
Source data for the tool:
Title: ${data.title}
Description: ${data.description}
Content: ${data.content}
`.trim()
}

/**
 * Em-dashes are a recognizable AI tell, and the model keeps emitting them
 * despite the prompt rule. Convert them to a spaced en-dash, which keeps the
 * dash's parenthetical rhythm (a comma reads badly, especially before a list)
 * without the em-dash giveaway. Code spans and fenced blocks are left
 * untouched, and existing en-dashes (number ranges like 2020–2024) aren't
 * matched.
 */
function replaceEmDashes(text: string): string {
  return text
    .split(/(```[\s\S]*?```|`[^`]*`)/g)
    .map((segment, index) => (index % 2 === 0 ? segment.replace(/\s*—\s*/g, " – ") : segment))
    .join("")
}

/**
 * Single-pass structured generation with the shared system prompt. Returns null
 * on failure (e.g. provider error, timeout, abort) and logs every failure
 * except an abort.
 */
async function generateStructured<T extends z.ZodObject>(
  schema: T,
  prompt: string,
  { signal, instructions }: GenerateOptions,
) {
  try {
    const { output } = await generateText({
      model: getChatModel(),
      output: Output.object({ schema }),
      system: CONTENT_SYSTEM_PROMPT,
      reasoning: CONTENT_REASONING,
      prompt: prompt + buildInstructionsBlock(instructions),
      abortSignal: signal,
      maxRetries: 0,
      timeout: AI_REQUEST_TIMEOUT_MS,
    })

    return output as z.infer<T>
  } catch (error) {
    if (!signal?.aborted) {
      console.error("AI generation failed:", error)
    }
    return null
  }
}

/**
 * Generate a tool's tagline, description and content from scraped website data.
 * Returns null on failure.
 */
export async function generateContent(data: ScrapedData, options: GenerateOptions = {}) {
  const output = await generateStructured(contentSchema, buildContentPrompt(data), options)

  if (!output) {
    return null
  }

  return {
    tagline: replaceEmDashes(output.tagline),
    description: replaceEmDashes(output.description),
    content: replaceEmDashes(output.content),
  }
}

/**
 * Generate a description from a free-form prompt. Returns null on failure.
 */
export async function generateDescription(prompt: string, options: GenerateOptions = {}) {
  const output = await generateStructured(descriptionSchema, prompt, options)

  if (!output) {
    return null
  }

  return { description: replaceEmDashes(output.description) }
}
