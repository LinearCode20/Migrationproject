import { requirePermission } from "~/lib/auth-guard"

export default async function ({ children }: LayoutProps<"/app/bookmarks">) {
  await requirePermission("bookmarks.read")
  return children
}
