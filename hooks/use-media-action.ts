import { getErrorMessage } from "@dirstack/utils"
import { useMutation } from "@tanstack/react-query"
import type { ChangeEvent } from "react"
import type { FieldPath, FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import { useEntityMediaUpload } from "~/hooks/use-entity-media-upload"
import { orpc } from "~/lib/orpc-query"

interface MediaActionConfig<T extends FieldValues> {
  form: UseFormReturn<T>
  path: string
  fieldName: FieldPath<T>
  fetchType?: "favicon" | "screenshot"
}

const uploadedMessage = "Media successfully uploaded. Please save to update."

export function useMediaAction<T extends FieldValues>({
  form,
  path,
  fieldName,
  fetchType,
}: MediaActionConfig<T>) {
  const { uploadToPath, isUploading } = useEntityMediaUpload()

  const fetchMutation = useMutation(
    orpc.media.fetch.mutationOptions({
      onSuccess: data => {
        toast.success(uploadedMessage)
        form.setValue(fieldName, data as PathValue<T, Path<T>>)
      },

      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  function handleFetch(url: string) {
    fetchMutation.mutate({ url, type: fetchType, path })
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]

    if (!file) {
      return
    }

    form.clearErrors(fieldName)

    try {
      const uploaded = await uploadToPath(path, file, fetchType)
      form.resetField(fieldName)
      form.setValue(fieldName, uploaded.url as PathValue<T, Path<T>>)
      toast.success(uploadedMessage)
    } catch (error) {
      const message = getErrorMessage(error, "Failed to upload media. Please try again.")
      form.setError(fieldName, { message })
    } finally {
      // Clear the input so choosing the same file again fires another change event.
      input.value = ""
    }
  }

  return {
    handleUpload,
    handleFetch,
    isUploading,
    isFetching: fetchMutation.isPending,
  }
}
