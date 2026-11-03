import type { Prisma } from "~/.generated/prisma/client"
import { generateUniqueSlug } from "~/server/shared/slugs"
import { db } from "~/services/db"

interface CreateToolData extends Omit<Prisma.ToolUncheckedCreateInput, "slug"> {
  slug?: string
}

interface CreateToolInput {
  data: CreateToolData
  categoryIds?: string[]
  tagIds?: string[]
}

/**
 * Create a tool with an auto-generated unique slug. Caller is responsible
 * for permission gating; this function performs pure data access.
 */
export async function createTool(input: CreateToolInput) {
  const { data, categoryIds, tagIds } = input

  const slug = await generateUniqueSlug(db.tool, data.slug || data.name)

  return db.tool.create({
    data: {
      ...data,
      slug,
      categories: categoryIds ? { connect: categoryIds.map(id => ({ id })) } : undefined,
      tags: tagIds ? { connect: tagIds.map(id => ({ id })) } : undefined,
    },
  })
}

interface UpdateToolInput {
  id: string
  data: Partial<Prisma.ToolUncheckedUpdateInput>
  nameOrSlug?: string
  currentSlug: string
  categoryIds?: string[]
  tagIds?: string[]
}

/**
 * Partial update on a tool. If `nameOrSlug` is provided, recompute the slug
 * (preserving the current value if the source would not change it).
 */
export async function updateTool(input: UpdateToolInput) {
  const { id, data, nameOrSlug, currentSlug, categoryIds, tagIds } = input

  const slug = nameOrSlug ? await generateUniqueSlug(db.tool, nameOrSlug, currentSlug) : undefined

  return db.tool.update({
    where: { id },
    data: {
      ...data,
      slug,
      categories: categoryIds && { set: categoryIds.map(id => ({ id })) },
      tags: tagIds && { set: tagIds.map(id => ({ id })) },
    },
  })
}

/**
 * Direct partial update used by the submit + verify flows that touch a
 * specific subset of fields without affecting slug or relations.
 */
export async function patchTool(id: string, data: Prisma.ToolUncheckedUpdateInput) {
  return db.tool.update({ where: { id }, data })
}

/**
 * Records that a user proved control of a tool's domain. Proving the domain wins, so the
 * user becomes the owner even when someone else owned the tool unverified.
 */
export async function verifyToolOwner(id: string, ownerId: string) {
  return patchTool(id, { ownerId, verifiedAt: new Date() })
}

/**
 * Permanently removes tools, returning them so the caller can clean up their S3
 * media. The read and delete share one transaction.
 */
export async function removeTools(ids: string[]) {
  return db.$transaction(async tx => {
    const tools = await tx.tool.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    })

    if (tools.length) {
      await tx.tool.deleteMany({ where: { id: { in: tools.map(tool => tool.id) } } })
    }

    return { tools }
  })
}

/**
 * A verification code is scoped to one (tool, user) pair, so redeeming it can
 * only ever assign that tool to that user. Codes issued elsewhere, including
 * Better-Auth's session-scoped one-time tokens, are not accepted here.
 */
function getOtpIdentifier(toolId: string, userId: string) {
  return `tool-verification:${toolId}:${userId}`
}

interface UpsertToolVerificationOtpInput {
  toolId: string
  userId: string
  otp: string
  expiresAt: Date
}

/**
 * Store the pending verification code for a (tool, user) pair, replacing any
 * earlier one.
 */
export async function upsertToolVerificationOtp(input: UpsertToolVerificationOtpInput) {
  const { toolId, userId, otp, expiresAt } = input
  const identifier = getOtpIdentifier(toolId, userId)

  return db.verification.upsert({
    where: { identifier },
    create: { identifier, value: otp, expiresAt },
    update: { value: otp, expiresAt },
  })
}

interface ConsumeToolVerificationOtpInput {
  toolId: string
  userId: string
  otp: string
}

/**
 * Delete the pending verification code for a (tool, user) pair when it matches
 * and has not expired. A zero `count` means nothing was redeemed; a wrong code
 * leaves the pending one intact so typos can be retried.
 */
export async function consumeToolVerificationOtp(input: ConsumeToolVerificationOtpInput) {
  const { toolId, userId, otp } = input

  return db.verification.deleteMany({
    where: {
      identifier: getOtpIdentifier(toolId, userId),
      value: otp,
      expiresAt: { gt: new Date() },
    },
  })
}
