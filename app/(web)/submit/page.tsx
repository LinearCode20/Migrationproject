import { cache } from "react"
import { SubmitForm } from "~/app/(web)/submit/form"
import { SubmitNote } from "~/app/(web)/submit/submit-note"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getNamespacePageData, getPageMetadata } from "~/lib/pages"

// Blocking route: data is awaited in the body so HTML ships in-order with no skeleton shell.
export const instant = false

const getData = cache(() => getNamespacePageData("submit", "/submit"))

export async function generateMetadata() {
  return getPageMetadata(await getData())
}

export default async function () {
  const { metadata } = await getData()

  return (
    <>
      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <Section>
        <Section.Content>
          <SubmitForm note={<SubmitNote />} />
        </Section.Content>
      </Section>
    </>
  )
}
