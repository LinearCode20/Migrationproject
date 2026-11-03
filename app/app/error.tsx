"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { useEffect } from "react"
import { Button } from "~/components/common/button"
import { H3 } from "~/components/common/heading"
import { Note } from "~/components/common/note"
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
    <div className="flex flex-col items-start gap-2 max-w-lg">
      <H3>{t("title")}</H3>

      <Note>
        {t.rich("description", {
          link: chunks => <Link href={`mailto:${siteConfig.email}`}>{chunks}</Link>,
        })}
      </Note>

      <Button className="mt-4" onClick={() => retry()}>
        {t("reload_button")}
      </Button>
    </div>
  )
}
