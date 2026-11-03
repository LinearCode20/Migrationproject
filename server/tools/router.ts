import { DAY_SECONDS, HOUR_SECONDS, tryCatch } from "@dirstack/utils"
import { ORPCError } from "@orpc/server"
import { createId } from "@paralleldrive/cuid2"
import { getTranslations } from "next-intl/server"
import { after } from "next/server"
import { type Tool, ToolStatus } from "~/.generated/prisma/client"
import { duplicateS3Media, removeS3Directories } from "~/lib/media"
import { canOwnTool, isEmailOnDomain, isToolTopTier, isUserOnDomain } from "~/lib/tools"
import { findPublicCategories } from "~/server/categories/queries"
import { sendEvent } from "~/server/events"
import { ensureFound } from "~/server/orpc/helpers"
import { authedProcedure, publicProcedure } from "~/server/orpc/procedure"
import { isSubscriptionTier } from "~/server/products/queries"
import { idSchema, idsSchema, relationListSchema } from "~/server/shared/schemas"
import { enrichTool } from "~/server/tools/enrichment"
import {
  consumeToolVerificationOtp,
  createTool,
  patchTool,
  removeTools,
  updateTool,
  verifyToolOwner,
} from "~/server/tools/mutations"
import {
  findDuplicateTool,
  findManagedTool,
  findNextPublishSlot,
  findScheduledTools,
  findTool,
  findToolById,
  findToolList,
  findTools,
} from "~/server/tools/queries"
import {
  toolCreateSchema,
  toolDuplicateSchema,
  toolEnrichSchema,
  toolListSchema,
  toolScheduleSchema,
  toolScheduledSchema,
  toolSubmitSchema,
  toolUpdateSchema,
  toolVerificationOtpConfirmSchema,
  toolVerificationOtpRequestSchema,
} from "~/server/tools/schema"
import { generateAndSendOtp } from "~/server/tools/utils"
import { isStripeEnabled } from "~/services/stripe"

/**
 * The fields a submitter gets back. A resubmitted URL can return someone else's
 * listing, so the owner details stay on the server.
 */
function toSubmitResult({ id, name, slug, status, tier }: Tool) {
  return { id, name, slug, status, tier }
}

const adminReads = authedProcedure.meta({
  permission: "tools.manage",
})

const adminWrites = authedProcedure.meta({
  permission: "tools.update",
})

const publicReads = publicProcedure.meta({
  permission: "tools.read",
})

// The fields `enrich_tool` can fill, grouped the way an agent asks to overwrite them.
const ENRICHABLE_FIELDS = {
  copy: ["tagline", "description", "content"],
  favicon: ["faviconUrl"],
  screenshot: ["screenshotUrl"],
} as const

/**
 * Send `tool.status_changed` when a write moved the tool to another status.
 */
function sendStatusChange(previous: Pick<Tool, "status">, tool: Tool, notifyOwner: boolean) {
  if (previous.status === tool.status) {
    return
  }

  sendEvent("tool.status_changed", {
    toolId: tool.id,
    previousStatus: previous.status,
    newStatus: tool.status,
    notifyOwner,
  })
}

/**
 * Load a tool for the domain verification flow: it must exist and not be verified yet.
 * An unverified owner doesn't block it, because proving the domain wins.
 */
async function findVerifiableTool(id: string) {
  const tool = ensureFound(await findTool({ where: { id } }), "Tool")

  if (tool.verifiedAt) {
    throw new ORPCError("CONFLICT", { message: "This tool has already been verified" })
  }

  return tool
}

export const tools = {
  list: adminReads
    .meta({
      mcp: {
        name: "list_tools",
        description:
          "List the directory's tools (its listings), newest first, without their Markdown content. Filter by `name` (a case-insensitive match on the name) and by `status`, and page with `page` and `perPage` (at most 100). Returns `tools`, `total` and `pageCount`.",
        annotations: { readOnlyHint: true, openWorldHint: false },
        omit: ["content"],
      },
    })
    .input(toolListSchema)
    .handler(async ({ input }) => findTools(input)),

  lookup: adminReads.output(relationListSchema).handler(async () => findToolList()),

  scheduled: adminReads.input(toolScheduledSchema).handler(async ({ input: { start, end } }) =>
    findScheduledTools({
      where: { publishedAt: { gte: start, lte: end } },
    }),
  ),

  byId: adminReads
    .meta({
      mcp: {
        name: "get_tool",
        description:
          "Get one tool by `id`, with every field: its copy (tagline, description, Markdown content), media URLs, status, tier, publish date and owner, and the ids of its categories and tags.",
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
    })
    .input(idSchema)
    .handler(async ({ input: { id } }) => ensureFound(await findToolById(id), "Tool")),

  /**
   * The signed-in user's own tools for the dashboard landing.
   * Session-scoped (not `adminReads`): the ownership filter is the security
   * boundary, so any authenticated user sees only their own tools.
   */
  dashboardList: authedProcedure
    .meta({ permission: "tools.submit" })
    .input(toolListSchema)
    .handler(async ({ input, context }) => findTools(input, { ownerId: context.user.id })),

  /**
   * The listing actions the signed-in user may take on a tool's public page. `canManage`
   * means the user owns the tool, whatever the tier. The page is cached for every
   * visitor, so the browser asks for these once it has a session.
   * Session-scoped, with no `meta.permission`: `findManagedTool` filters on the owner, so
   * that filter is the security boundary, and any other caller gets the same answer as for
   * a tool that doesn't exist.
   */
  access: authedProcedure.input(idSchema).handler(async ({ input: { id }, context: { user } }) => {
    const tool = await findManagedTool(id, user.id)

    if (!tool) {
      return { canManage: false, canUpgrade: false, canManageBilling: false }
    }

    // A failed catalog load hides the billing action rather than failing the whole check.
    const { data: canManageBilling } = await tryCatch(isSubscriptionTier(tool.tier))

    // Without Stripe there is no paid tier to upgrade to.
    return {
      canManage: true,
      canUpgrade: isStripeEnabled && !isToolTopTier(tool),
      canManageBilling: !!canManageBilling,
    }
  }),

  filterOptions: publicReads.handler(async () => {
    const categories = await findPublicCategories()

    return [
      {
        type: "category" as const,
        options: categories.map(({ slug, name, _count }) => ({
          slug,
          name,
          count: _count.tools,
        })),
      },
    ].filter(({ options }) => options.length)
  }),

  create: adminWrites
    .meta({
      permission: "tools.create",
      mcp: {
        name: "create_tool",
        description:
          "Create a tool. `name` and `websiteUrl` are required. A new tool is a Draft on the Free tier unless you set `status` and `tier`. `content` is Markdown. `categories` and `tags` take ids from list_categories and list_tags. To schedule it, set `status` to Scheduled and `publishedAt` to an ISO date. Set `notifyOwner` to true to email the owner about its status.",
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
        defaults: { notifyOwner: false },
      },
    })
    .input(toolCreateSchema)
    .handler(async ({ input }) => {
      const { categories, tags, notifyOwner, ...data } = input

      const tool = await createTool({ data, categoryIds: categories, tagIds: tags })

      sendEvent("tool.status_changed", {
        toolId: tool.id,
        previousStatus: null,
        newStatus: tool.status,
        notifyOwner,
      })

      return tool
    }),

  update: adminWrites
    .meta({
      mcp: {
        name: "update_tool",
        description:
          "Update a tool by `id`. Send only the fields to change. `categories` and `tags` replace the tool's current set. Changing `name` also changes the slug, and with it the page URL, unless you pass the current `slug`. Set `status` to Draft to take the tool off the site. Set `notifyOwner` to true to email the owner when `status` changes.",
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
        defaults: { notifyOwner: false },
      },
    })
    .input(toolUpdateSchema)
    .handler(async ({ input }) => {
      const { id, categories, tags, notifyOwner, ...data } = input

      const existingTool = ensureFound(await findToolById(id), "Tool")

      const tool = await updateTool({
        id,
        data,
        nameOrSlug: data.slug || data.name,
        currentSlug: existingTool.slug,
        categoryIds: categories,
        tagIds: tags,
      })

      sendStatusChange(existingTool, tool, notifyOwner)

      return tool
    }),

  duplicate: adminWrites.input(idSchema).handler(async ({ input: { id } }) => {
    const tool = ensureFound(await findToolById(id), "Tool")
    const newId = createId()
    const moveMedia = await duplicateS3Media(`tools/${tool.id}`, `tools/${newId}`)

    const newTool = await createTool({
      data: {
        id: newId,
        name: `${tool.name} (Copy)`,
        websiteUrl: tool.websiteUrl,
        affiliateUrl: tool.affiliateUrl,
        tagline: tool.tagline,
        description: tool.description,
        content: tool.content && moveMedia(tool.content),
        faviconUrl: tool.faviconUrl && moveMedia(tool.faviconUrl),
        screenshotUrl: tool.screenshotUrl && moveMedia(tool.screenshotUrl),
      },
      categoryIds: tool.categories.map(category => category.id),
      tagIds: tool.tags.map(tag => tag.id),
    })

    return newTool
  }),

  findDuplicate: adminReads
    .meta({
      mcp: {
        name: "find_duplicate_tool",
        description:
          "Check whether the directory already lists a website, before you create a tool for it. Matches the canonical URL, so `https://www.example.com/` finds `example.com`. Returns `tool` (its id, name, slug and status) or null.",
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
    })
    .input(toolDuplicateSchema)
    .handler(async ({ input: { websiteUrl } }) => {
      const tool = await findDuplicateTool(websiteUrl)
      return {
        tool: tool && { id: tool.id, name: tool.name, slug: tool.slug, status: tool.status },
      }
    }),

  enrich: adminWrites
    .meta({
      mcp: {
        name: "enrich_tool",
        description:
          "Fill a tool's empty fields from its website: the tagline, description and Markdown content, the favicon and a screenshot. It reads the live site and can take up to a minute. Fields that already have a value stay as they are, unless `overwrite` names them: `copy`, `favicon` or `screenshot`. Returns `filled`, the fields it changed, and the updated `tool`. A field it could not fill stays empty, for you to write with update_tool.",
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
      },
    })
    .input(toolEnrichSchema)
    .handler(async ({ input: { id, overwrite } }) => {
      const tool = ensureFound(await findToolById(id), "Tool")
      const cleared = overwrite.flatMap(group => ENRICHABLE_FIELDS[group])
      const enriched = await enrichTool({
        ...tool,
        ...Object.fromEntries(cleared.map(field => [field, null])),
      })

      const fields = Object.values(ENRICHABLE_FIELDS).flat()
      const filled = enriched ? fields.filter(field => enriched[field] !== tool[field]) : []

      return { filled, tool: enriched ?? tool }
    }),

  schedule: adminWrites
    .meta({
      mcp: {
        name: "schedule_tool",
        description:
          "Schedule a tool for publication. Without `publishedAt`, it takes the next free slot: the first publish day after today that no other scheduled tool holds, with one tool per publish day. The daily publish job makes it live on that date. Set `notifyOwner` to true to email the owner when the tool becomes Scheduled.",
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
        defaults: { notifyOwner: false },
      },
    })
    .input(toolScheduleSchema)
    .handler(async ({ input: { id, publishedAt, notifyOwner } }) => {
      const existingTool = ensureFound(await findToolById(id), "Tool")

      const tool = await patchTool(id, {
        status: ToolStatus.Scheduled,
        publishedAt: publishedAt ?? (await findNextPublishSlot(id)),
      })

      sendStatusChange(existingTool, tool, notifyOwner)

      return tool
    }),

  remove: adminWrites
    .meta({ permission: "tools.delete" })
    .input(idsSchema)
    .handler(async ({ input: { ids } }) => {
      const { tools } = await removeTools(ids)

      after(async () => {
        if (tools.length) {
          await removeS3Directories(tools.map(tool => `tools/${tool.id}`))
        }
      })

      return { success: true }
    }),

  submit: authedProcedure
    .meta({
      permission: "tools.submit",
      rateLimit: { points: 3, duration: DAY_SECONDS },
    })
    .input(toolSubmitSchema)
    .handler(async ({ input: data, context: { user } }) => {
      // The submitter owns the tool. A verified email on the website's domain proves they run
      // it, so the tool is verified too.
      const verifiedAt = isUserOnDomain(user, data.websiteUrl) ? new Date() : undefined
      const existingTool = await findDuplicateTool(data.websiteUrl)

      if (existingTool) {
        // A tool without an owner, such as one an admin imported, goes to its first submitter.
        // A resubmission takes a listing from its owner only by proving the domain.
        if (!canOwnTool(existingTool, user)) {
          return toSubmitResult(existingTool)
        }

        const tool = await patchTool(existingTool.id, {
          ownerId: user.id,
          verifiedAt: existingTool.verifiedAt ?? verifiedAt,
          submitterNote: data.submitterNote,
        })

        return toSubmitResult(tool)
      }

      const { data: tool, error } = await tryCatch(
        createTool({
          data: {
            ...data,
            status: ToolStatus.Pending,
            ownerId: user.id,
            verifiedAt,
          },
        }),
      )

      if (error) {
        console.error("Failed to submit tool:", error)
        const t = await getTranslations("forms.submit")
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: t("errors.failed_submission") })
      }

      sendEvent("tool.submitted", { toolId: tool.id })

      return toSubmitResult(tool)
    }),

  sendVerificationOtp: authedProcedure
    .meta({
      permission: "tools.verify",
      rateLimit: { points: 5, duration: HOUR_SECONDS },
    })
    .input(toolVerificationOtpRequestSchema)
    .handler(async ({ input: { toolId, email }, context: { user } }) => {
      const tool = await findVerifiableTool(toolId)

      if (!isEmailOnDomain(email, tool.websiteUrl)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Email domain must match the tool's website domain",
        })
      }

      await generateAndSendOtp(tool.id, user.id, email)

      return { success: true }
    }),

  /**
   * Verifies a tool in one step when the signed-in user's verified email sits on its domain.
   * Signing in already proved control of that inbox, so no code is sent.
   */
  verifyWithAccountEmail: authedProcedure
    .meta({
      permission: "tools.verify",
      rateLimit: { points: 5, duration: HOUR_SECONDS },
    })
    .input(idSchema)
    .handler(async ({ input: { id }, context: { user } }) => {
      const tool = await findVerifiableTool(id)

      if (!isUserOnDomain(user, tool.websiteUrl)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Email domain must match the tool's website domain",
        })
      }

      await verifyToolOwner(tool.id, user.id)

      return { success: true }
    }),

  confirmVerificationOtp: authedProcedure
    .meta({
      permission: "tools.verify",
      rateLimit: { points: 5, duration: HOUR_SECONDS },
    })
    .input(toolVerificationOtpConfirmSchema)
    .handler(async ({ input: { toolId, otp }, context: { user } }) => {
      const tool = await findVerifiableTool(toolId)
      const { count } = await consumeToolVerificationOtp({ toolId: tool.id, userId: user.id, otp })

      // Brute force is bounded by the procedure's rate limit.
      if (!count) {
        throw new ORPCError("BAD_REQUEST", { message: "Invalid or expired verification code" })
      }

      await verifyToolOwner(tool.id, user.id)

      return { success: true }
    }),
}
