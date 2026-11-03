import { ArrowRightIcon } from "lucide-react"
import type { ComponentProps, ReactElement } from "react"
import { Button } from "~/components/common/button"
import { H4 } from "~/components/common/heading"
import { Stack } from "~/components/common/stack"
import { cx } from "~/lib/utils"

interface ListingProps extends ComponentProps<typeof Stack> {
  title?: string
  button?: ReactElement
  buttonLabel?: string
}

export function Listing({
  children,
  className,
  title,
  button,
  buttonLabel,
  ...props
}: ListingProps) {
  return (
    <Stack size="lg" direction="column" className={cx("items-stretch gap-4", className)} {...props}>
      <Stack className="w-full justify-between">
        {title && <H4 render={<h3 />}>{title}</H4>}

        <span className="flex-1 ml-1 mr-auto h-0.5 max-w-20 bg-border" />

        {button && (
          <Button
            size="md"
            variant="secondary"
            suffix={<ArrowRightIcon />}
            render={button}
            className="-my-1"
          >
            {buttonLabel}
          </Button>
        )}
      </Stack>

      {children}
    </Stack>
  )
}
