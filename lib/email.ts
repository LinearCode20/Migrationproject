import type { WithRequired } from "@dirstack/utils"
import { render } from "@react-email/components"
import type { CreateEmailOptions, CreateEmailResponseSuccess } from "resend"
import { siteConfig } from "~/config/site"
import { env, isProd } from "~/env"
import { getResendClient } from "~/services/resend"

/**
 * Email parameters for sending emails via Resend.
 * `react` and `subject` are required, `from` and `text` are automatically set.
 */
type EmailParams = WithRequired<Omit<CreateEmailOptions, "from" | "text" | "template">, "subject">

/**
 * Prepares an email for sending by adding defaults
 * @param email - The email to prepare
 * @returns The prepared email with `from` and `text` fields
 */
async function prepareEmail(email: EmailParams): Promise<CreateEmailOptions> {
  return {
    ...email,
    from: `${siteConfig.name} <${env.RESEND_SENDER_EMAIL ?? siteConfig.email}>`,
    replyTo: email.replyTo ?? siteConfig.email,
    text: await render(email.react, { plainText: true }),
  }
}

/**
 * Sends an email to the given recipient using Resend
 * @param email - The email to send
 * @returns The sent email's id from Resend, or undefined in development
 * @throws When Resend is not configured in production, or when Resend rejects the email,
 * since the SDK returns errors instead of throwing them
 */
export async function sendEmail(
  email: EmailParams,
): Promise<CreateEmailResponseSuccess | undefined> {
  const payload = await prepareEmail(email)

  if (!isProd) {
    console.log("Email payload:", payload)
    return
  }

  const { data, error } = await getResendClient().emails.send(payload)

  if (error) {
    console.error(`Failed to send email "${payload.subject}":`, error)
    throw new Error(`Failed to send email: ${error.message}`, { cause: error })
  }

  return data
}
