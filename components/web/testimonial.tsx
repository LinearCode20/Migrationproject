import { getTranslations } from "next-intl/server"
import type { ComponentProps } from "react"
import { Markdown } from "~/components/web/markdown"
import { Author } from "~/components/web/ui/author"
import { siteConfig } from "~/config/site"
import { cx } from "~/lib/utils"

export async function Testimonial({ className, ...props }: ComponentProps<"blockquote">) {
  const t = await getTranslations("components.testimonial")

  return (
    <blockquote
      className={cx("flex flex-col items-center gap-4 max-w-2xl mx-auto text-center", className)}
      {...props}
    >
      <Markdown code={t("quote", { siteName: siteConfig.name })} className="text-lg/relaxed" />

      <Author
        name={t("author.name")}
        note={t("author.note")}
        image="/authors/piotrkulpinski.webp"
      />
    </blockquote>
  )
}
