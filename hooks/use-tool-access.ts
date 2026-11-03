import { useQuery } from "@tanstack/react-query"
import { useSession } from "~/lib/auth-client"
import { orpc } from "~/lib/orpc-query"

/**
 * The listing actions the signed-in user may take on a tool. The tool page is cached for
 * every visitor, so the browser asks the server once it has a session, and guests get
 * no actions.
 */
export function useToolAccess(toolId: string) {
  const { data: session } = useSession()

  const { data } = useQuery(
    orpc.tools.access.queryOptions({ input: { id: toolId }, enabled: !!session?.user }),
  )

  return {
    canManage: !!data?.canManage,
    canUpgrade: !!data?.canUpgrade,
    canManageBilling: !!data?.canManageBilling,
  }
}
