import { HOUR_SECONDS } from "@dirstack/utils"
import { NextResponse } from "next/server"
import { siteConfig } from "~/config/site"
import { sitemaps } from "~/config/sitemaps"

function buildSitemapIndex(sitemaps: string[]) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>'
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'

  for (const url of sitemaps) {
    xml += "<sitemap>"
    xml += `<loc>${url}</loc>`
    xml += "</sitemap>"
  }

  xml += "</sitemapindex>"
  return xml
}

export function GET() {
  const { url } = siteConfig
  const sitemapIndexXML = buildSitemapIndex(sitemaps.map(id => `${url}/sitemap/${id}.xml`))

  return new NextResponse(sitemapIndexXML, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": `public, max-age=${HOUR_SECONDS}, s-maxage=${HOUR_SECONDS}, stale-while-revalidate=${HOUR_SECONDS}`,
    },
  })
}
