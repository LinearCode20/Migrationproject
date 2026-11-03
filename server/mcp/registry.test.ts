import { describe, expect, it } from "bun:test"
import { os } from "@orpc/server"
import { z } from "zod"
import { collectMcpTools, resolveMcpDefaults } from "~/server/mcp/registry"
import type { SessionUser } from "~/server/orpc/context"
import type { ProcedureMeta } from "~/server/orpc/procedure"

const base = os.$meta<ProcedureMeta>({})

const router = {
  hidden: base.handler(() => "hidden"),
  things: {
    list: base
      .meta({ permission: "tools.read", mcp: { name: "list_things", description: "List things." } })
      .input(z.object({ page: z.number().default(1) }))
      .handler(() => []),
    update: base
      .meta({
        mcp: {
          name: "update_thing",
          description: "Update a thing.",
          defaults: { notifyOwner: false },
        },
      })
      .input(
        z.object({
          id: z.string(),
          publishedAt: z.coerce.date().nullish(),
          notifyOwner: z.boolean().default(true),
        }),
      )
      .handler(() => null),
    stats: base
      .meta({ permission: "metrics.read", mcp: { name: "get_stats", description: "Stats." } })
      .handler(() => 0),
    create: base
      .meta({
        mcp: {
          name: "create_thing",
          description: "Create a thing.",
          defaults: { authorId: (user: SessionUser) => user.id },
        },
      })
      .input(z.object({ title: z.string(), authorId: z.string().min(1) }))
      .handler(() => null),
  },
}

const tools = collectMcpTools(router)

function findTool(name: string) {
  const tool = tools.find(tool => tool.name === name)

  if (!tool) {
    throw new Error(`No tool named ${name}`)
  }

  return tool
}

describe("collectMcpTools", () => {
  it("collects only procedures that declare meta.mcp, at any depth", () => {
    expect(tools.map(tool => tool.name).sort()).toEqual([
      "create_thing",
      "get_stats",
      "list_things",
      "update_thing",
    ])
  })

  it("records each tool's router path", () => {
    expect(findTool("list_things").path).toEqual(["things", "list"])
  })

  it("converts the input schema without the $schema keyword", () => {
    const { inputSchema } = findTool("list_things")

    expect(inputSchema.type).toBe("object")
    expect(inputSchema.$schema).toBeUndefined()
    expect(inputSchema.properties?.page).toMatchObject({ type: "number", default: 1 })
  })

  it("describes a date as an ISO date-time string", () => {
    const { inputSchema } = findTool("update_thing")
    const publishedAt = JSON.stringify(inputSchema.properties?.publishedAt)

    expect(publishedAt).toContain('"format":"date-time"')
  })

  it("replaces a procedure default with the tool's default", () => {
    const { inputSchema, defaults } = findTool("update_thing")

    expect(inputSchema.properties?.notifyOwner).toMatchObject({ default: false })
    expect(defaults).toEqual({ notifyOwner: false })
  })

  it("gives a procedure without input an empty object schema", () => {
    expect(findTool("get_stats").inputSchema).toEqual({ type: "object", properties: {} })
  })

  it("does not require a field the tool defaults", () => {
    const { inputSchema } = findTool("create_thing")

    expect(inputSchema.required).toEqual(["title"])
    expect(inputSchema.properties?.authorId).not.toHaveProperty("default")
  })
})

describe("MCP tool audience", () => {
  it("serves a procedure a guest may call on the public server", () => {
    expect(findTool("list_things").audience).toBe("public")
  })

  it("serves a procedure behind an admin permission on the admin server", () => {
    expect(findTool("get_stats").audience).toBe("admin")
  })

  it("serves a procedure without a permission on the admin server", () => {
    expect(findTool("update_thing").audience).toBe("admin")
  })
})

describe("resolveMcpDefaults", () => {
  it("resolves a function default for the calling user", () => {
    const user = { id: "admin-1" } as unknown as SessionUser

    expect(resolveMcpDefaults(findTool("create_thing"), user)).toEqual({ authorId: "admin-1" })
    expect(resolveMcpDefaults(findTool("update_thing"), user)).toEqual({ notifyOwner: false })
  })

  it("leaves out a function default without a user", () => {
    expect(resolveMcpDefaults(findTool("create_thing"), null)).toEqual({})
  })
})
