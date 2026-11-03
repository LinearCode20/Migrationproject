import { useRender } from "@base-ui/react/use-render"
import Image from "next/image"
import type { ComponentProps } from "react"
import { boxVariants } from "~/components/common/box"
import { cx } from "~/lib/utils"

interface OverlayImageProps extends useRender.ComponentProps<"div"> {
  src: string
  alt?: string
  loading?: ComponentProps<"img">["loading"]
  fetchPriority?: ComponentProps<"img">["fetchPriority"]
}

export function OverlayImage({
  className,
  render,
  src,
  alt = "",
  loading,
  fetchPriority,
  ...props
}: OverlayImageProps) {
  return useRender({
    render,
    defaultTagName: "div",
    props: {
      className: cx(
        boxVariants({ interactive: true }),
        "not-prose group relative rounded-lg overflow-clip",
        className,
      ),
      children: (
        <Image
          src={src}
          alt={alt}
          width={1280}
          height={1024}
          loading={loading}
          fetchPriority={fetchPriority}
          className="aspect-video h-auto w-full object-cover object-top will-change-transform group-hover:scale-[101%] dark:opacity-90"
        />
      ),
      ...props,
    },
  })
}
