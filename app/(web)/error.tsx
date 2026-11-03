"use client"

import { RotateCwIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useEffect } from "react"
import { Button } from "~/components/common/button"
import { Stack } from "~/components/common/stack"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { siteConfig } from "~/config/site"

interface ErrorProps {
  error: Error & { digest?: string }
  retry: () => void
}

export default function ({ error, retry }: ErrorProps) {
  const t = useTranslations("pages.error")

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Intro alignment="center">
      <IntroTitle>{t("title")}</IntroTitle>

      <IntroDescription className="max-w-xl">
        {t.rich("description", {
          link: chunks => <Link href={`mailto:${siteConfig.email}`}>{chunks}</Link>,
        })}
      </IntroDescription>

      <Stack className="mt-4">
        <Button variant="fancy" prefix={<RotateCwIcon />} onClick={() => retry()}>
          {t("reload_button")}
        </Button>

        <Button variant="soft" render={<Link href="/" />}>
          {t("home_button")}
        </Button>
      </Stack>
    </Intro>
  )
}
