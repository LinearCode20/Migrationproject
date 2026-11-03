import type { ComponentProps } from "react"
import { Carousel } from "~/components/common/carousel"
import { cx } from "~/lib/utils"

export function ProductList({ className, ...props }: ComponentProps<typeof Carousel>) {
  return <Carousel className={cx("gap-5 md:flex-wrap md:justify-center", className)} {...props} />
}
