import "highseat"

// Every custom event the site sends, declared once. `strict` makes a misspelt name or a missing
// property a type error.
declare module "highseat" {
  interface Register {
    events: {
      click_website: { url: string; tier: string; source: string }
      click_share: { url: string; platform: string }
      click_ad: { url: string; source?: string }
      submit_tool: { slug: string }
      start_checkout: { tier: string }
      subscribe_newsletter: { source: string }
    }
    strict: true
  }
}
