import { parseAsStringLiteral, useQueryState } from "nuqs"

const toolDialogs = ["report", "embed", "verify"] as const

/**
 * The open dialog on a tool page, kept in the `?dialog=` query param so a link can open it.
 * `ToolActions` renders the dialogs, and any component on the page can open one.
 */
export function useToolDialog() {
  return useQueryState("dialog", parseAsStringLiteral(toolDialogs))
}
