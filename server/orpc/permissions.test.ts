import { describe, expect, it } from "bun:test"
import type { SessionUser } from "~/server/orpc/context"
import { can, matchesPattern } from "~/server/orpc/permissions"

function asUser(role: string, id = "u1") {
  return { id, role } as unknown as SessionUser
}

const admin = asUser("admin", "admin-1")
const member = asUser("user", "user-1")
const guest = null

describe("matchesPattern", () => {
  it("wildcard grant covers everything", () => {
    expect(matchesPattern("*", "tools.read")).toBe(true)
    expect(matchesPattern("*", "anything.at.all")).toBe(true)
  })

  it("entity wildcard covers any action on that entity", () => {
    expect(matchesPattern("tools.*", "tools.read")).toBe(true)
    expect(matchesPattern("tools.*", "tools.update")).toBe(true)
    expect(matchesPattern("tools.*", "tools.delete")).toBe(true)
  })

  it("entity wildcard does not cross entity boundaries", () => {
    expect(matchesPattern("tools.*", "posts.read")).toBe(false)
    expect(matchesPattern("tools.*", "toolsx.read")).toBe(false)
  })

  it("atomic grant matches the same permission exactly", () => {
    expect(matchesPattern("tools.read", "tools.read")).toBe(true)
    expect(matchesPattern("tools.read", "tools.update")).toBe(false)
  })
})

describe("can: admin role", () => {
  it("allows any permission", () => {
    expect(can(admin, "tools.read")).toBe(true)
    expect(can(admin, "users.delete")).toBe(true)
    expect(can(admin, "anything.at.all")).toBe(true)
  })
})

describe("can: guest (unauthenticated)", () => {
  it("allows the public actions a guest is granted", () => {
    expect(can(guest, "tools.read")).toBe(true)
    expect(can(guest, "search.read")).toBe(true)
    expect(can(guest, "subscribe.create")).toBe(true)
    expect(can(guest, "reports.create")).toBe(true)
  })

  it("denies admin-only reads (these gate the management procedures)", () => {
    expect(can(guest, "categories.read")).toBe(false)
    expect(can(guest, "tags.read")).toBe(false)
    expect(can(guest, "posts.read")).toBe(false)
    expect(can(guest, "tools.manage")).toBe(false)
  })

  it("denies authenticated-only and admin actions", () => {
    expect(can(guest, "tools.update")).toBe(false)
    expect(can(guest, "tools.submit")).toBe(false)
    expect(can(guest, "products.checkout")).toBe(false)
    expect(can(guest, "bookmarks.write")).toBe(false)
  })

  it("falls back to guest for users with an unknown role string", () => {
    const weird = asUser("nonexistent-role")
    expect(can(weird, "tools.read")).toBe(true)
    expect(can(weird, "tools.submit")).toBe(false)
  })
})

describe("can: user role", () => {
  it("allows direct grants", () => {
    expect(can(member, "tools.read")).toBe(true)
    expect(can(member, "tools.submit")).toBe(true)
    expect(can(member, "tools.verify")).toBe(true)
    expect(can(member, "products.checkout")).toBe(true)
  })

  it("entity wildcard grant covers all actions on that entity", () => {
    expect(can(member, "bookmarks.read")).toBe(true)
    expect(can(member, "bookmarks.write")).toBe(true)
    // The wildcard covers any action, including ones with no matching procedure.
    expect(can(member, "bookmarks.anything")).toBe(true)
  })

  it("inherits every public grant (signed-in users keep anonymous abilities)", () => {
    expect(can(member, "search.read")).toBe(true)
    expect(can(member, "subscribe.create")).toBe(true)
    expect(can(member, "reports.create")).toBe(true)
  })

  it("denies actions not in any grant", () => {
    expect(can(member, "users.delete")).toBe(false)
    expect(can(member, "tools.update")).toBe(false)
  })
})

describe("can: undefined / null user", () => {
  it("treats undefined the same as null (guest)", () => {
    expect(can(undefined, "tools.read")).toBe(true)
    expect(can(undefined, "tools.submit")).toBe(false)
  })
})
