import { getDomain } from "@dirstack/utils"
import { env } from "~/env"

export const siteConfig = {
  name: "Dirstarter",
  slug: "dirstarter",
  email: env.NEXT_PUBLIC_SITE_EMAIL,
  url: env.NEXT_PUBLIC_SITE_URL,
  domain: getDomain(env.NEXT_PUBLIC_SITE_URL),
  currency: "usd",
  author: {
    name: "Piotr Kulpinski",
    image: "/authors/piotrkulpinski.webp",
    url: "https://kulpinski.pl",
  },
  stats: {
    pageviews: 250_000,
    tools: 2_000,
    subscribers: 5_000,
  },
}
