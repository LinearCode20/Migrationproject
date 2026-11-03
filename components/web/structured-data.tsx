import type { Graph } from "schema-dts"

interface StructuredDataProps {
  data: Graph
}

/**
 * Serialize JSON for an inline script. `JSON.stringify` leaves `<` as is, so a value
 * containing `</script>` would close the tag and run as HTML. The escaped `<` is
 * still valid JSON and parses back to `<`.
 */
function serializeJsonForScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonForScript(data) }}
    />
  )
}
