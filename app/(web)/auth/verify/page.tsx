import { getTranslations } from "next-intl/server"
import { createLoader, parseAsString } from "nuqs/server"
import { cache } from "react"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { NavLink } from "~/components/web/ui/nav-link"
import { getNamespacePageData, getPageMetadata } from "~/lib/pages"

// Post-magic-link landing that echoes `?email`. Dynamic per request, so it blocks.
export const instant = false

const searchParamsLoader = createLoader({ email: parseAsString.withDefault("") })

const getData = cache(() => getNamespacePageData("auth.verify", "/auth/verify"))

export async function generateMetadata() {
  return getPageMetadata(await getData())
}

export default async function ({ searchParams }: PageProps<"/auth/verify">) {
  const { email } = await searchParamsLoader(searchParams)
  const { metadata } = await getData()
  const t = await getTranslations("pages.auth.verify")

  return (
    <>
      <Intro>
        <IntroTitle size="h3">{metadata.title}</IntroTitle>

        <IntroDescription className="text-sm!">{t("instructions", { email })}</IntroDescription>
      </Intro>

      <p className="text-xs text-muted-foreground/75">
        {t.rich("no_email", {
          link: chunks => (
            <NavLink href="/auth/login" className="inline font-medium">
              {chunks}
            </NavLink>
          ),
        })}
      </p>
    </>
  )
}
