import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

/**
 * Copies text to the clipboard and flips `copied` for two seconds. `navigator.clipboard` is
 * missing outside a secure context and can reject (a denied permission), so a failure shows an
 * error toast and `copy` resolves to `false` instead of the caller saying something was copied.
 */
export function useCopy() {
  const t = useTranslations("common")
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      toast.error(t("copy_failed"))
      return false
    }

    clearTimeout(timer.current)
    setCopied(true)
    timer.current = setTimeout(() => setCopied(false), 2000)
    return true
  }

  return { copied, copy }
}
