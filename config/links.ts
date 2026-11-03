import type { SocialProvider } from "~/components/common/icons/socials"
import { siteConfig } from "~/config/site"

interface LinksConfig {
  /**
   * List of RSS feed URLs for the site.
   */
  feeds: { title: string; url: string }[]

  /**
   * Add a URL for any provider we have a brand icon for and it renders in the
   * footer automatically. Remove it and it disappears. See the `socials` registry.
   */
  socials: Partial<Record<SocialProvider, string>>
}

export const linksConfig: LinksConfig = {
  feeds: [
    { title: "RSS » Tools", url: `${siteConfig.url}/rss/tools.xml` },
    { title: "RSS » Blog Posts", url: `${siteConfig.url}/rss/posts.xml` },
  ],
  socials: {
    github: "https://github.com/dirstarter/dirstarter",
  },
}
