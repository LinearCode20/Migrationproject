import { requirePermission } from "~/lib/auth-guard"

export default async function ({ children }: LayoutProps<"/app/tags">) {
  await requirePermission("tags.read")
  return children
}
