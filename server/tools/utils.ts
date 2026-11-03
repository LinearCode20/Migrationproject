import { getRandomDigits, MINUTE_MS } from "@dirstack/utils"
import { after } from "next/server"
import { siteConfig } from "~/config/site"
import { verificationsConfig } from "~/config/verifications"
import { EmailVerifyDomain } from "~/emails/verify-domain"
import { sendEmail } from "~/lib/email"
import { upsertToolVerificationOtp } from "~/server/tools/mutations"

/**
 * Canonical key for duplicate detection: host (lowercased, www-stripped) plus
 * path (trailing-slash-stripped), ignoring protocol, port, query string, and
 * fragment. Returns `null` for malformed URLs.
 */
export function getCanonicalWebsiteUrl(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url)
    const host = hostname.replace(/^www\./, "")
    const path = pathname.replace(/\/+$/, "")
    return `${host}${path}`
  } catch {
    return null
  }
}

/**
 * Issue a verification code for the (tool, user) pair and email it to the
 * supplied address. Re-requesting overwrites the pending code. The email send
 * is deferred via `after()` so the response returns before SMTP delivery.
 */
export async function generateAndSendOtp(toolId: string, userId: string, email: string) {
  const otp = getRandomDigits(verificationsConfig.otpLength)
  const expiresAt = new Date(Date.now() + verificationsConfig.otpExpiration * MINUTE_MS)

  await upsertToolVerificationOtp({ toolId, userId, otp, expiresAt })

  after(async () => {
    const to = email
    const subject = `Your ${siteConfig.name} Verification Code`
    await sendEmail({ to, subject, react: EmailVerifyDomain({ to, otp }) })
  })
}
