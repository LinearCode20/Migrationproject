import { requirePermission } from "~/lib/auth-guard"

export default async function ({ children }: LayoutProps<"/app/reports">) {
  await requirePermission("reports.read")
  return children
}
