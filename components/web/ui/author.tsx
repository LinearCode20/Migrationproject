import Image from "next/image"
import type { ComponentProps, ReactNode } from "react"
import { Stack } from "~/components/common/stack"

interface AuthorProps extends ComponentProps<typeof Stack> {
  name: string
  image: string
  prefix?: string
  note?: ReactNode
}

export function Author({ name, image, prefix, note, ...props }: AuthorProps) {
  return (
    <Stack wrap={false} {...props}>
      {image && <Image src={image} alt="" width={48} height={48} className="size-10 rounded-md" />}

      <div className="flex-1 min-w-0 text-sm/normal text-start text-secondary-foreground">
        <h3 className="truncate *:font-medium">
          {prefix ? `${prefix} ` : ""}
          <span>{name}</span>
        </h3>

        {note && <div className="opacity-50 truncate">{note}</div>}
      </div>
    </Stack>
  )
}
