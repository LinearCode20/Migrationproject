import { ArrowLeftIcon, CalendarDaysIcon, LayoutGridIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Stack } from "~/components/common/stack"
import { SearchField } from "~/components/web/search-field"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { NavLink } from "~/components/web/ui/nav-link"
import { getCollection } from "~/config/collections"

export default async function NotFound() {
  const t = await getTranslations("pages.not_found")
  const hasLatest = !!getCollection("latest")

  return (
    <Intro alignment="center">
      <IntroTitle>{t("title")}</IntroTitle>
      <IntroDescription className="max-w-lg">{t("description")}</IntroDescription>

      <SearchField className="self-center max-w-md mt-6">{t("search_placeholder")}</SearchField>

      <Stack size="lg" className="justify-center gap-x-6 mt-3 text-sm">
        <NavLink href="/" prefix={<ArrowLeftIcon />}>
          {t("home_link")}
        </NavLink>

        {hasLatest && (
          <NavLink href="/collections/latest" prefix={<CalendarDaysIcon />}>
            {t("latest_link")}
          </NavLink>
        )}

        <NavLink href="/categories" prefix={<LayoutGridIcon />}>
          {t("categories_link")}
        </NavLink>
      </Stack>
    </Intro>
  )
}
