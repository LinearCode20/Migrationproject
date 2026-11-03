import { LoaderIcon } from "lucide-react"
import { cache, Suspense } from "react"
import { Login } from "~/components/web/auth/login"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { getNamespacePageData, getPageMetadata } from "~/lib/pages"

// Blocking route: data is awaited in the body so HTML ships in-order with no skeleton shell.
export const instant = false

const getData = cache(() => getNamespacePageData("auth.login", "/auth/login"))

export async function generateMetadata() {
  return getPageMetadata(await getData())
}

export default async function () {
  const { metadata } = await getData()

  return (
    <>
      <Intro>
        <IntroTitle size="h3">{metadata.title}</IntroTitle>
        <IntroDescription className="md:text-sm">{metadata.description}</IntroDescription>
      </Intro>

      <Suspense fallback={<LoaderIcon className="animate-spin mx-auto" />}>
        <Login />
      </Suspense>
    </>
  )
}
