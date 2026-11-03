import type { JsonSchemaType, ToolAnnotations } from "@modelcontextprotocol/server"
import { type AnyProcedure, isProcedure } from "@orpc/server"
import { z } from "zod"
import type { SessionUser } from "~/server/orpc/context"
import { can } from "~/server/orpc/permissions"
import type { ProcedureMeta } from "~/server/orpc/procedure"

/**
 * The server that lists a tool: `public` for a procedure whose permission a guest holds, served
 * at `/mcp` to anyone, and `admin` for the rest, served at `/api/mcp` behind `MCP_SECRET`. A
 * procedure without a permission goes on the admin server, so nothing reaches the public one by
 * omission.
 */
export type McpAudience = "admin" | "public"

/** An input value, or a function of the calling user that returns one. */
type McpToolDefault = unknown | ((user: SessionUser) => unknown)

/**
 * Exposes a procedure as an MCP tool, through `meta.mcp`. The tool runs the procedure itself, so
 * its permission, rate limit and side effects apply exactly as they do in the admin UI.
 */
export interface McpToolMeta {
  /** The name agents call the tool by, in snake case, such as `list_tools`. */
  name: string

  /** What the tool does, when to call it and what it returns. Agents read it to pick a tool. */
  description: string

  /** Hints about the tool's effects, such as `readOnlyHint` or `destructiveHint`. */
  annotations?: ToolAnnotations

  /**
   * Input the tool fills in when an agent leaves it out, in place of the procedure's own default.
   * An agent's bulk edit, for example, should not email every owner it touches. A function value
   * receives the calling user, such as a post's author. A defaulted field is never required.
   */
  defaults?: Record<string, McpToolDefault>

  /**
   * Fields to leave out of the result, at any depth. A list drops each record's Markdown body,
   * which would outweigh the rest of the page, and leaves it to the matching `get_` tool.
   */
  omit?: string[]
}

export interface McpTool extends McpToolMeta {
  /** The procedure's path in the router, such as `["tools", "list"]`. */
  path: string[]
  procedure: AnyProcedure
  inputSchema: JsonSchemaType
  audience: McpAudience
}

/**
 * The procedure's input as the JSON Schema an MCP client shows the agent. A date becomes an ISO
 * date-time string, which the procedure's own schema coerces back. Defaults from `meta.mcp`
 * replace the procedure's, so the schema states what the tool does.
 */
function toInputJsonSchema(schema: unknown, defaults: Record<string, McpToolDefault> = {}) {
  if (!schema) {
    return { type: "object", properties: {} } as JsonSchemaType
  }

  if (!(schema instanceof z.ZodType)) {
    throw new TypeError("An MCP tool's procedure must take a Zod input schema")
  }

  const { $schema: _, ...jsonSchema } = z.toJSONSchema(schema, {
    io: "input",
    unrepresentable: "any",
    override: ({ zodSchema, jsonSchema }) => {
      if (zodSchema._zod.def.type === "date") {
        jsonSchema.type = "string"
        jsonSchema.format = "date-time"
      }
    },
  })

  for (const [key, value] of Object.entries(defaults)) {
    const property = jsonSchema.properties?.[key]

    if (property && typeof property === "object" && typeof value !== "function") {
      property.default = value
    }
  }

  const required = jsonSchema.required?.filter(key => !(key in defaults))

  return { ...jsonSchema, required: required?.length ? required : undefined } as JsonSchemaType
}

interface RouterProcedure {
  path: string[]
  procedure: AnyProcedure
}

/**
 * Every procedure in the router, at any depth, with its path.
 */
function listProcedures(router: Record<string, unknown>, path: string[] = []): RouterProcedure[] {
  return Object.entries(router).flatMap(([key, value]) => {
    if (isProcedure(value)) {
      return [{ path: [...path, key], procedure: value }]
    }

    if (value && typeof value === "object") {
      return listProcedures(value as Record<string, unknown>, [...path, key])
    }

    return []
  })
}

/**
 * Every procedure in the router that declares `meta.mcp`, as an MCP tool. Procedures without it
 * stay off the MCP server.
 */
export function collectMcpTools(router: Record<string, unknown>): McpTool[] {
  return listProcedures(router).flatMap(({ path, procedure }) => {
    const { meta, inputSchema } = procedure["~orpc"]
    const { mcp, permission } = meta as ProcedureMeta

    if (!mcp) {
      return []
    }

    return [
      {
        ...mcp,
        path,
        procedure,
        inputSchema: toInputJsonSchema(inputSchema, mcp.defaults),
        audience: permission && can(null, permission) ? "public" : "admin",
      } satisfies McpTool,
    ]
  })
}

/**
 * The tool's input defaults for one call, with function values resolved for the calling user. A
 * guest has no user, so a function default is left out.
 */
export function resolveMcpDefaults(tool: McpToolMeta, user: SessionUser | null) {
  return Object.fromEntries(
    Object.entries(tool.defaults ?? {}).flatMap(([key, value]) => {
      if (typeof value !== "function") {
        return [[key, value]]
      }

      return user ? [[key, value(user)]] : []
    }),
  )
}
