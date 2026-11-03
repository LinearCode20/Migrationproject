import { Shell } from "~/components/app/shell"
import { AIProvider } from "~/contexts/ai-context"
import { UserProvider } from "~/contexts/user-context"
import { requireUser } from "~/lib/auth-guard"
import { isAIEnabled } from "~/services/ai"

// Auth-gated: the session read must block the response so anonymous callers are
// redirected server-side, not shown a streamed shell. Opts the whole `/app`
// subtree out of static-shell prerendering. See https://dirstarter.com/docs/codebase/caching.
//
// This export alone covers the *static-shell* decision for the whole subtree;
// `isPageAllowedToBlock` walks from the root and stops at the first `false`. It
// does not cover the instant-navigation *validation*, which Next applies to each
// page segment independently, so every `/app/**/page.tsx` repeats it. Nested
// layouts don't need it: they never trigger the validation.
export const instant = false

export default async function ({ children }: LayoutProps<"/app">) {
  const user = await requireUser()

  return (
    <UserProvider user={user}>
      <AIProvider isAIEnabled={isAIEnabled}>
        <Shell>{children}</Shell>
      </AIProvider>
    </UserProvider>
  )
}
