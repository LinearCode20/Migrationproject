import type { Metadata } from "next"
import { UserTable } from "~/components/app/users/user-table"

export const metadata: Metadata = {
  title: "Users",
}

// See the `instant` note in app/app/layout.tsx.
export const instant = false

export default function () {
  return <UserTable />
}
