import { requirePermission } from "~/lib/auth-guard"

export default async function ({ children }: LayoutProps<"/app/tools">) {
  await requirePermission("tools.manage")
  return children
}
