import { useRender } from "@base-ui/react/use-render"
import { cx } from "~/lib/utils"

type NoteProps = useRender.ComponentProps<"p">

export function Note({ className, render, ...props }: NoteProps) {
  return useRender({
    render,
    defaultTagName: "p",
    props: { className: cx("text-sm/normal text-muted-foreground", className), ...props },
  })
}
