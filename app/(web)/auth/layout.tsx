import type { Metadata } from "next"
import type { PropsWithChildren } from "react"
import { Card } from "~/components/common/card"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ({ children }: PropsWithChildren) {
  return <Card className="max-w-85 mx-auto">{children}</Card>
}
