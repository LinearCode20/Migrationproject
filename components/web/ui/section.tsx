import type { ComponentProps } from "react"
import { Wrapper } from "~/components/common/wrapper"
import { Sticky } from "~/components/web/ui/sticky"
import { cva, cx, type VariantProps } from "~/lib/utils"

const sectionSidebarVariants = cva({
  base: "flex flex-col gap-y-5 md:col-span-1",

  variants: {
    // A static sidebar stretches to the full row height, so nested Sticky elements can travel within it.
    sticky: {
      false: "md:self-stretch",
    },
  },
})

interface SectionSidebarProps
  extends ComponentProps<"div">, VariantProps<typeof sectionSidebarVariants> {}

function SectionBase({ className, gap = "md", ...props }: ComponentProps<typeof Wrapper>) {
  return (
    <Wrapper
      gap={gap}
      className={cx("items-start gap-x-6 md:grid md:grid-cols-3 lg:gap-x-8", className)}
      {...props}
    />
  )
}

function SectionContent({ className, gap = "md", ...props }: ComponentProps<typeof Wrapper>) {
  return <Wrapper gap={gap} className={cx("items-start md:col-span-2", className)} {...props} />
}

function SectionSidebar({ className, sticky = true, ...props }: SectionSidebarProps) {
  const sidebar = <div className={cx(sectionSidebarVariants({ sticky, className }))} {...props} />

  if (!sticky) {
    return sidebar
  }

  return <Sticky>{sidebar}</Sticky>
}

export const Section = Object.assign(SectionBase, {
  Content: SectionContent,
  Sidebar: SectionSidebar,
})
