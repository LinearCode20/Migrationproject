import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import { Button } from "~/components/common/button"
import { H3 } from "~/components/common/heading"
import { Kbd } from "~/components/common/kbd"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"

interface EntityFormHeaderProps {
  title?: string
  /** Full-width note rendered below the title, e.g. the public URL. */
  note?: ReactNode
  /** Header actions, e.g. AI generation or the actions menu. */
  children?: ReactNode
}

export function EntityFormHeader({ title, note, children }: EntityFormHeaderProps) {
  return (
    <Stack className="justify-between">
      <H3 title={title} className="flex-1 min-w-48 truncate">
        {title}
      </H3>

      <Stack size="sm" className="-my-0.5">
        {children}
      </Stack>

      {note && <Note className="w-full wrap-anywhere">{note}</Note>}
    </Stack>
  )
}

interface EntityFormFooterProps {
  cancelHref: string
  children: ReactNode
}

export function EntityFormFooter({ cancelHref, children }: EntityFormFooterProps) {
  return (
    <div className="flex justify-between gap-4 col-span-full">
      <Button size="md" variant="secondary" render={<Link href={cancelHref} />}>
        Cancel
      </Button>

      {children}
    </div>
  )
}

export function EntityFormSubmit(props: ComponentProps<typeof Button>) {
  return (
    <Button
      type="submit"
      size="md"
      suffix={<Kbd variant="outline" keys={["mod", "enter"]} />}
      {...props}
    />
  )
}
