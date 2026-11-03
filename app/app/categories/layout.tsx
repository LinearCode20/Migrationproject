import { requirePermission } from "~/lib/auth-guard"

export default async function ({ children }: LayoutProps<"/app/categories">) {
  await requirePermission("categories.read")
  return children
}
