import { requirePermission } from "~/lib/auth-guard"

export default async function ({ children }: LayoutProps<"/app/users">) {
  await requirePermission("users.read")
  return children
}
