import { adminClient, magicLinkClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import type { SocialProviders } from "better-auth/social-providers"
import { env } from "~/env"

/** A social sign-in provider better-auth supports, such as `google` or `github`. */
export type SocialProvider = keyof SocialProviders

export const { signIn, signOut, useSession, admin } = createAuthClient({
  baseURL: env.NEXT_PUBLIC_SITE_URL,
  plugins: [adminClient(), magicLinkClient()],
})
