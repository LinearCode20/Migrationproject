import { type CreateContactOptions, Resend } from "resend"
import { env } from "~/env"

/**
 * Resend is on only when both its API key and sender address are set. Without
 * it, development logs emails and production refuses to send them.
 */
export const isResendEnabled = !!env.RESEND_API_KEY && !!env.RESEND_SENDER_EMAIL

let resend: Resend | undefined

/**
 * The Resend client, created on first use. The SDK throws on a missing key at
 * construction, so creating it on import would crash every module that sends email.
 * @throws When Resend is not configured.
 */
export function getResendClient() {
  if (!isResendEnabled) {
    throw new Error("Email is not configured. Set RESEND_API_KEY and RESEND_SENDER_EMAIL.")
  }

  resend ??= new Resend(env.RESEND_API_KEY)
  return resend
}

export async function createResendContact(payload: CreateContactOptions) {
  const { error, data } = await getResendClient().contacts.create(payload)

  if (error) {
    throw new Error("Failed to create resend contact. Please try again later.")
  }

  return data?.id
}
