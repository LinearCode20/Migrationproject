import type { CSSProperties } from "react"
import { Skeleton } from "~/components/common/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/common/table"

const SKELETON_COLUMN_COUNT = 5
const SKELETON_ROW_COUNT = 10

interface DataTableSkeletonRowsProps {
  columnCount: number
}

export function DataTableSkeletonRows({ columnCount }: DataTableSkeletonRowsProps) {
  const columns = Array.from({ length: columnCount }, (_, index) => index)

  return (
    <>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map(column => (
            <TableHead key={column}>
              <Skeleton className="h-6 w-full" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, row) => (
          <TableRow key={row} className="hover:bg-transparent">
            {columns.map(column => (
              <TableCell key={column}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </>
  )
}

export function DataTableSkeleton() {
  return (
    <div className="w-full space-y-4 overflow-auto">
      <div className="flex w-full items-center justify-between space-x-2 overflow-auto">
        <div className="flex flex-1 items-center space-x-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-18 border-dashed" />
          <Skeleton className="h-8 w-18 border-dashed" />
        </div>

        <Skeleton className="ml-auto hidden h-8 w-18 lg:flex" />
      </div>

      <Table
        style={
          {
            "--table-columns": `repeat(${SKELETON_COLUMN_COUNT}, minmax(0, 1fr))`,
          } as CSSProperties
        }
        className="rounded-md border"
      >
        <DataTableSkeletonRows columnCount={SKELETON_COLUMN_COUNT} />
      </Table>

      <div className="flex w-full items-center justify-between gap-4 overflow-auto sm:gap-8">
        <Skeleton className="h-8 w-40 shrink-0" />
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-18" />
          </div>
          <div className="flex items-center justify-center text-sm font-medium">
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="hidden size-8 lg:block" />
            <Skeleton className="size-8" />
            <Skeleton className="size-8" />
            <Skeleton className="hidden size-8 lg:block" />
          </div>
        </div>
      </div>
    </div>
  )
}
