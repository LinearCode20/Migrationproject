import type { Row, Table } from "@tanstack/react-table"
import type { ComponentProps, MouseEventHandler } from "react"
import { boxVariants } from "~/components/common/box"
import { cx } from "~/lib/utils"

/** Index of the last clicked row per table, the anchor for shift-click range selection. */
const selectionAnchors = new WeakMap<object, number>()

interface RowCheckboxProps<TData> extends ComponentProps<"input"> {
  table?: Table<TData>
  row?: Row<TData>
}

export function RowCheckbox<TData>({ className, table, row, ...props }: RowCheckboxProps<TData>) {
  const handleClick: MouseEventHandler<HTMLInputElement> = ({ shiftKey, currentTarget }) => {
    if (!table || !row) {
      return
    }

    const { checked } = currentTarget
    const anchorIndex = selectionAnchors.get(table)

    if (shiftKey && anchorIndex !== undefined) {
      const { rows } = table.getRowModel()

      const start = Math.min(anchorIndex, row.index)
      const end = Math.max(anchorIndex, row.index)

      for (const rangeRow of rows.slice(start, end + 1)) {
        if (rangeRow.index !== row.index && rangeRow.getCanSelect()) {
          rangeRow.toggleSelected(checked)
        }
      }
    }

    selectionAnchors.set(table, row.index)
  }

  return (
    <label className={cx("relative z-10 cursor-pointer select-none", className)}>
      <input
        type="checkbox"
        name="select"
        className={cx(boxVariants({ interactive: true }), "block")}
        onClick={handleClick}
        {...props}
      />

      <span className="absolute -inset-3 -right-2 z-0" />
    </label>
  )
}
