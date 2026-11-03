import { requirePermission } from "~/lib/auth-guard"

export default async function ({ children }: LayoutProps<"/app/posts">) {
  await requirePermission("posts.read")
  return children
}
