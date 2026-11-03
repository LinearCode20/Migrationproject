import { useState } from "react"
import type { FieldValues, UseFormReturn } from "react-hook-form"

interface PublishFields {
  status?: string
  publishedAt?: Date | null
}

interface UsePublishSubmitOptions<TValues extends FieldValues, TOutput extends PublishFields> {
  form: UseFormReturn<TValues, unknown, TOutput>
  /** Sends the validated values, typically to a mutation. */
  onValid: (data: TOutput) => void
  /** Whether the mutation behind `onValid` is in flight. */
  isPending: boolean
}

/**
 * Wires a form to `PublishActions`: a regular save keeps the current status,
 * a status change submits the form with the chosen status and publish date.
 * Pending state is split so only the button that started the submit spins.
 */
export function usePublishSubmit<TValues extends FieldValues, TOutput extends PublishFields>({
  form,
  onValid,
  isPending,
}: UsePublishSubmitOptions<TValues, TOutput>) {
  const [isStatusSubmit, setIsStatusSubmit] = useState(false)

  const onSubmit = form.handleSubmit(data => {
    setIsStatusSubmit(false)
    onValid(data)
  })

  function handleStatusSubmit(status: NonNullable<TOutput["status"]>, publishedAt: Date | null) {
    void form.handleSubmit(data => {
      setIsStatusSubmit(true)
      onValid({ ...data, status, publishedAt })
    })()
  }

  return {
    onSubmit,
    handleStatusSubmit,
    isPending: isPending && !isStatusSubmit,
    isStatusPending: isPending && isStatusSubmit,
  }
}
