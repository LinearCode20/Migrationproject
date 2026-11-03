import Image from "next/image"
import type { ComponentProps } from "react"
import { cva, type VariantProps } from "~/lib/utils"

const faviconVariants = cva({
  base: "size-9 rounded-[0.375em] mix-blend-multiply dark:mix-blend-normal",
  variants: {
    contained: {
      true: "p-[0.1875em] border",
    },
  },
  defaultVariants: {
    contained: false,
  },
})

interface FaviconProps
  extends
    Omit<ComponentProps<"img">, "src" | "width" | "height">,
    VariantProps<typeof faviconVariants> {
  src?: string | null
  size?: number
}

export function Favicon({
  className,
  src,
  alt = "",
  contained,
  size = 64,
  loading = "lazy",
  ...props
}: FaviconProps) {
  if (!src) {
    return null
  }

  return (
    <Image
      src={src}
      alt={alt}
      loading={loading}
      width={size}
      height={size}
      className={faviconVariants({ contained, className })}
      {...props}
    />
  )
}
