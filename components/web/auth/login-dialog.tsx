import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/common/dialog"
import { Login } from "~/components/web/auth/login"
import { useSession } from "~/lib/auth-client"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Explains why sign-in is needed. Defaults to the generic sign-in description. */
  description?: ReactNode
  /** Overrides the default return URL, for example to carry a pending action. */
  callbackURL?: string
}

export function LoginDialog({ open, onOpenChange, description, callbackURL }: LoginDialogProps) {
  const t = useTranslations("pages.auth.login")
  const { data: session } = useSession()

  if (session?.user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xs">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>

          <DialogDescription>
            <p>{description ?? t("description")}</p>
          </DialogDescription>
        </DialogHeader>

        <Login callbackURL={callbackURL} />
      </DialogContent>
    </Dialog>
  )
}
