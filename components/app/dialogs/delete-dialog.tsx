import { ucFirst } from "@dirstack/utils"
import { type UseMutationOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import plur from "plur"
import type { ReactElement, ReactNode } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "~/components/app/dialogs/confirm-dialog"

type DeleteMutationOptions = (options: {
  onSuccess: () => void
  onError: (error: Error) => void
}) => Pick<UseMutationOptions<unknown, Error, { ids: string[] }>, "mutationKey" | "mutationFn">

interface DeleteDialogProps {
  children: ReactElement
  ids: string[]
  label: string
  mutationOptions: DeleteMutationOptions
  queryKey: readonly unknown[]
  onExecute?: () => void

  /** Replaces the default "permanently delete N items" copy. */
  description?: ReactNode
}

export function DeleteDialog({
  children,
  ids,
  label,
  mutationOptions,
  queryKey,
  onExecute,
  description,
}: DeleteDialogProps) {
  const queryClient = useQueryClient()
  const pluralizedLabel = plur(label, ids.length)

  const deleteMutation = useMutation(
    mutationOptions({
      onSuccess: () => {
        toast.success(`${ucFirst(pluralizedLabel)} deleted successfully`)
        queryClient.invalidateQueries({ queryKey })
        onExecute?.()
      },
      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  return (
    <ConfirmDialog
      variant="destructive"
      confirmLabel={`Delete ${pluralizedLabel}`}
      description={
        description ?? (
          <>
            This action cannot be undone. This will permanently delete{" "}
            <strong className="whitespace-nowrap">
              {ids.length} {pluralizedLabel}
            </strong>{" "}
            from the database.
          </>
        )
      }
      onConfirm={() => deleteMutation.mutateAsync({ ids })}
    >
      {children}
    </ConfirmDialog>
  )
}
