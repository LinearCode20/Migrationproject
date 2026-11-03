import { getTranslations } from "next-intl/server"
import { H2 } from "~/components/common/heading"

export default async function () {
  const t = await getTranslations("pages.not_found")

  return (
    <div className="flex flex-col gap-2 max-w-sm">
      <H2>{t("title")}</H2>
      <p className="text-muted-foreground text-pretty">{t("description")}</p>
    </div>
  )
}
