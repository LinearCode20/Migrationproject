import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import type { AppRouter } from "~/server/orpc/router"

const link = new RPCLink({
  url: () => {
    if (typeof window === "undefined") {
      throw new Error("RPCLink should only be used on the client side.")
    }

    return `${window.location.origin}/api/rpc`
  },
  fetch: (request, init) =>
    globalThis.fetch(request, {
      ...init,
      credentials: "include",
    }),
})

export const client: RouterClient<AppRouter> = createORPCClient(link)
