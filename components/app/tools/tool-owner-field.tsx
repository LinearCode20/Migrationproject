import { formatDateTime } from "@dirstack/utils"
import Link from "next/link"
import { type ComponentProps, useId } from "react"
import type { User } from "~/.generated/prisma/browser"
import { Field, FieldLabel } from "~/components/common/field"
import { Input } from "~/components/common/input"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"

interface ToolOwnerFieldProps extends ComponentProps<typeof Field> {
  owner: Pick<User, "id" | "name" | "email">
  verifiedAt: Date | null
}

/**
 * The account that manages the tool, read-only. Ownership changes when someone submits the
 * tool first, pays for it or proves its domain.
 */
export function ToolOwnerField({ owner, verifiedAt, ...props }: ToolOwnerFieldProps) {
  const id = useId()

  return (
    <Field {...props}>
      <Stack className="w-full justify-between">
        <FieldLabel htmlFor={id}>Owner</FieldLabel>

        <Note className="text-xs">
          {verifiedAt
            ? `Domain verified on ${formatDateTime(verifiedAt, { dateStyle: "medium" })}`
            : "Domain not verified"}
          {" · "}
          <Link href={`/app/users/${owner.id}`} className="underline">
            View user
          </Link>
        </Note>
      </Stack>

      <Input id={id} value={owner.name ? `${owner.name} <${owner.email}>` : owner.email} readOnly />
    </Field>
  )
}
