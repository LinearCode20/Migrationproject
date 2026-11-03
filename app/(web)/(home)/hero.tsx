import { getTranslations } from "next-intl/server"
import type { ComponentProps } from "react"
import { Badge } from "~/components/common/badge"
import { BuiltWith } from "~/components/web/built-with"
import { CTAForm } from "~/components/web/cta-form"
import { CTAProof } from "~/components/web/cta-proof"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { cx } from "~/lib/utils"

export async function Hero({ className, ...props }: ComponentProps<"section">) {
  const t = await getTranslations()

  return (
    <section className={cx("flex flex-col gap-y-6 w-full pb-fluid-sm", className)} {...props}>
      <Intro alignment="center">
        <IntroTitle className="max-w-[16em] lg:text-5xl/[1.1]!">{t("brand.tagline")}</IntroTitle>
        <IntroDescription className="lg:mt-2">{t("brand.description")}</IntroDescription>

        <Badge render={<BuiltWith medium="hero" />} className="-order-1 font-normal" />
      </Intro>

      <CTAForm
        source="hero"
        size="lg"
        buttonProps={{ size: "md", variant: "fancy" }}
        className="max-w-sm mx-auto items-center text-center"
      >
        <CTAProof />
      </CTAForm>
    </section>
  )
}
