import { cva } from "~/lib/utils"

export const boxVariants = cva({
  base: "border transition duration-100 ease-out",

  variants: {
    interactive: {
      true: "cursor-pointer hover:border-ring",
    },
    // A box around a text field draws the field's focus ring on its own edge, so the field
    // inside it opts out with `outline-none`.
    fieldFocus: {
      true: "field-focus:outline-2 field-focus:-outline-offset-1 field-focus:outline-focus",
    },
  },
})
