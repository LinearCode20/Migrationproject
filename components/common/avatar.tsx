"use client"

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { cx } from "~/lib/utils"

export function Avatar({ className, ...props }: AvatarPrimitive.Root.Props) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cx("relative flex size-10 shrink-0 overflow-clip bg-accent rounded-md", className)}
      {...props}
    />
  )
}

export function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cx("aspect-square size-full", className)}
      {...props}
    />
  )
}

export function AvatarFallback({ className, ...props }: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cx("flex size-full items-center justify-center text-xs", className)}
      {...props}
    />
  )
}
