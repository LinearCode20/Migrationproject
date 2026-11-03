import type { PropsWithChildren } from "react"
import { Sidebar } from "~/components/app/sidebar"

export function Shell({ children }: PropsWithChildren) {
  return (
    <div className="flex items-stretch size-full">
      <Sidebar />

      <div className="grid grid-cols-1 content-start gap-4 flex-1 min-w-0 p-4 sm:px-6">
        {children}
      </div>
    </div>
  )
}
