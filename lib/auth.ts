import { HOUR_SECONDS, tryCatch } from "@dirstack/utils"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { betterAuth } from "better-auth/minimal"
import { nextCookies } from "better-auth/next-js"
import { admin, magicLink } from "better-auth/plugins"
import type { SocialProviders } from "better-auth/social-providers"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import type { NextRequest } from "next/server"
import { cache } from "react"
import { siteConfig } from "~/config/site"
import { EmailMagicLink } from "~/emails/magic-link"
import { env } from "~/env"
import type { SocialProvider } from "~/lib/auth-client"
import { sendEmail } from "~/lib/email"
import { CLIENT_IP_HEADER } from "~/lib/request"
import { db } from "~/services/db"
import { redis as redisClient } from "~/services/redis"

const AUTH_SECONDARY_STORAGE_TTL = HOUR_SECONDS

/**
 * Social sign-in providers, each on only when its client id and secret are set. To add
 * one, add an entry here, its variables in `env.ts` and its icon in `Login`.
 */
const socialProviders: SocialProviders = {
  ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
    ? { google: { clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET } }
    : {}),
}

/**
 * The social providers that are on. The list is site-wide, so server components read it
 * and pass it to the login UI.
 */
export const enabledSocialProviders = Object.keys(socialProviders) as SocialProvider[]

// A local const, because TypeScript does not narrow an imported binding inside
// the storage callbacks below.
const redis = redisClient

/**
 * Run a secondary storage operation, logging a failure and returning
 * `fallback` instead of throwing.
 */
async function safe<T, F>(op: string, run: () => Promise<T>, fallback: F) {
  const { data, error } = await tryCatch(run())

  if (error) {
    console.error(`Auth secondary storage ${op} failed:`, error)
    return fallback
  }

  return data ?? fallback
}

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  // Redis cache for sessions + magic-link verification records. better-auth
  // treats this as authoritative when configured, so a failure here breaks auth
  // (an unstored magic-link token verifies as INVALID_TOKEN). Failures are logged
  // so a down or misconfigured Redis is visible; each op still degrades to its
  // fallback. To run without Redis, leave REDIS_URL unset; then this is off and
  // better-auth uses the database.
  secondaryStorage: redis
    ? {
        get: key => safe("get", () => redis.get(key), null),
        getAndDelete: key => safe("getAndDelete", () => redis.getdel(key), null),
        increment: (key, ttl) =>
          safe(
            "increment",
            async () => {
              const value = await redis.incr(key)
              // Set the expiry only when the counter is first created; later
              // increments must not extend the window.
              if (value === 1) {
                await redis.expire(key, ttl)
              }
              return value
            },
            0,
          ),
        set: (key, value, ttl) =>
          safe(
            "set",
            async () => {
              await redis.set(key, value, "EX", ttl ?? AUTH_SECONDARY_STORAGE_TTL)
            },
            undefined,
          ),
        delete: key =>
          safe(
            "delete",
            async () => {
              await redis.del(key)
            },
            undefined,
          ),
      }
    : undefined,

  socialProviders,

  account: {
    accountLinking: {
      enabled: true,
    },
  },

  // Read the client IP only from the header the proxy sets with the `TRUSTED_PROXY` rule.
  // No fallback header: `cf-connecting-ip` and `x-forwarded-for` are client-controlled on
  // some hosts, so a fallback would let a caller pick a fresh rate-limit bucket per request.
  advanced: {
    ipAddress: {
      ipAddressHeaders: [CLIENT_IP_HEADER],
    },
  },

  onAPIError: {
    onError: error => console.error(error),
  },

  hooks: {
    after: createAuthMiddleware(async ({ path, context }) => {
      const { responseHeaders } = context

      if (path.startsWith("/callback/:id")) {
        const callbackURL = responseHeaders?.get("location")

        if (callbackURL) {
          revalidatePath(callbackURL)
        }
      }
    }),
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const to = email
        const subject = `Your ${siteConfig.name} Login Link`
        const { error } = await tryCatch(
          sendEmail({ to, subject, react: EmailMagicLink({ to, url }) }),
        )

        // A plain error reaches the client as a bare 500 with no message for the login form to show.
        if (error) {
          throw new APIError("INTERNAL_SERVER_ERROR", {
            message: "Unable to send the login link. Please try again later.",
          })
        }
      },
    }),

    admin(),

    // Must be the last plugin.
    nextCookies(),
  ],
})

export const getServerSession = cache(async (request?: NextRequest) =>
  auth.api.getSession({
    headers: request?.headers ?? (await headers()),
  }),
)

export type Session = NonNullable<Awaited<ReturnType<typeof getServerSession>>>
