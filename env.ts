import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app isn't
   * built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().min(1),
    CRON_SECRET: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url().min(1),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    REDIS_URL: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_SENDER_EMAIL: z.email().optional(),
    S3_ENDPOINT: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_PUBLIC_URL: z.url().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    SCREENSHOTONE_ACCESS_KEY: z.string().optional(),
    HIGHSEAT_PATH: z.string().startsWith("/").optional(),
    HIGHSEAT_SECRET: z.string().optional(),
    HIGHSEAT_API_KEY: z.string().optional(),
    AI_GATEWAY_API_KEY: z.string().optional(),
    AI_CHAT_MODEL: z.string().default("anthropic/claude-sonnet-5.5"),
    AI_COMPLETION_MODEL: z.string().default("google/gemini-3.5-flash-lite"),
    JINA_API_KEY: z.string().optional(),
    WEBHOOK_URL: z.url().optional(),
    WEBHOOK_TOKEN: z.string().optional(),
    MCP_SECRET: z.string().min(32).optional(),
    TRUSTED_PROXY: z.enum(["cloudflare"]).optional(),
  },

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SITE_URL: z.url().min(1),
    NEXT_PUBLIC_SITE_EMAIL: z.email().min(1),
    NEXT_PUBLIC_HIGHSEAT_SITE: z.string().optional(),
    NEXT_PUBLIC_REVINEL_WORKSPACE_ID: z.string().optional(),
    NEXT_PUBLIC_REVINEL_API_URL: z.url().optional(),
    NEXT_PUBLIC_REVINEL_APP_URL: z.url().optional(),
  },

  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SITE_EMAIL: process.env.NEXT_PUBLIC_SITE_EMAIL,
    NEXT_PUBLIC_HIGHSEAT_SITE: process.env.NEXT_PUBLIC_HIGHSEAT_SITE,
    NEXT_PUBLIC_REVINEL_WORKSPACE_ID: process.env.NEXT_PUBLIC_REVINEL_WORKSPACE_ID,
    NEXT_PUBLIC_REVINEL_API_URL: process.env.NEXT_PUBLIC_REVINEL_API_URL,
    NEXT_PUBLIC_REVINEL_APP_URL: process.env.NEXT_PUBLIC_REVINEL_APP_URL,
  },

  /**
   * Production needs at least one way to sign in. Magic links need Resend, and the other
   * ways are the social providers in `lib/auth.ts`. Each provider there adds its variables
   * to `hasSocialLogin`. Development always has a way in, because it logs magic links
   * instead of sending them. The client never sees the server variables, so only the
   * server checks.
   */
  createFinalSchema: (shape, isServer) =>
    z.object(shape).superRefine((values, context) => {
      const hasResend = !!values.RESEND_API_KEY && !!values.RESEND_SENDER_EMAIL
      const hasSocialLogin = !!values.AUTH_GOOGLE_ID && !!values.AUTH_GOOGLE_SECRET

      if (isServer && process.env.NODE_ENV === "production" && !hasResend && !hasSocialLogin) {
        context.addIssue({
          code: "custom",
          message:
            "Sign-in is not configured. Set RESEND_API_KEY and RESEND_SENDER_EMAIL for magic links, or the client id and secret of a social provider, such as AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.",
        })
      }
    }),

  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
})

export const isProd = process.env.NODE_ENV === "production"
export const isDev = !isProd

/**
 * Public base URL that stored objects are served from: the explicit public URL
 * when set, else the bucket's default S3 endpoint. A function, not a const, so
 * importing this module on the client never evaluates the server-only S3 vars.
 */
export function getS3PublicUrl() {
  return env.S3_PUBLIC_URL ?? `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`
}
