import { describe, expect, it } from "bun:test"
import { collectMcpTools } from "~/server/mcp/registry"
import { can } from "~/server/orpc/permissions"
import type { ProcedureMeta } from "~/server/orpc/procedure"
import { appRouter } from "~/server/orpc/router"

const tools = collectMcpTools(appRouter)

describe("MCP tool exposure", () => {
  // An agent reads text that visitors and owners wrote, such as report messages and submitter
  // notes, so no delete runs over MCP: injected text can never trigger one.
  it("exposes no delete", () => {
    for (const tool of tools) {
      expect(tool.path.at(-1)).not.toBe("remove")
      expect(tool.annotations?.destructiveHint).not.toBe(true)
    }
  })

  it("lists a tool a guest may call on the public server, and every other on the admin one", () => {
    for (const tool of tools) {
      const { permission } = tool.procedure["~orpc"].meta as ProcedureMeta
      const isGuestAllowed = !!permission && can(null, permission)

      expect(tool.audience).toBe(isGuestAllowed ? "public" : "admin")
    }
  })

  // Assistant directories (Claude, ChatGPT) require a title and an explicit read-only hint.
  it("keeps every public tool read-only and titled", () => {
    for (const tool of tools.filter(tool => tool.audience === "public")) {
      expect(tool.annotations?.readOnlyHint).toBe(true)
      expect(tool.annotations?.title).toBeString()
    }
  })
})

describe.each(["admin", "public"] as const)("MCP tool list budget: %s", audience => {
  const audienceTools = tools.filter(tool => tool.audience === audience)

  // Most clients load the whole list into context every session, and Cursor sends only the
  // first 40 tools across every server it connects.
  it("stays within 25 tools", () => {
    expect(audienceTools.length).toBeLessThanOrEqual(25)
  })

  it("stays within 25 KB", () => {
    const list = audienceTools.map(({ name, description, inputSchema, annotations }) => ({
      name,
      description,
      inputSchema,
      annotations,
    }))

    expect(JSON.stringify(list).length).toBeLessThanOrEqual(25 * 1024)
  })

  // Claude Code cuts a description at 4,096 characters.
  it("keeps every description under 4,096 characters", () => {
    for (const tool of audienceTools) {
      expect(tool.description.length).toBeLessThan(4096)
    }
  })

  it("gives every tool a unique snake case name", () => {
    const names = audienceTools.map(tool => tool.name)

    expect(new Set(names).size).toBe(names.length)

    for (const name of names) {
      expect(name).toMatch(/^[a-z]+(_[a-z]+)*$/)
    }
  })
})
