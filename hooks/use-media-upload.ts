"use client"

import { getErrorMessage, joinUrlPaths } from "@dirstack/utils"
import { toast } from "sonner"
import { useEntityMediaUpload, type UploadedMediaFile } from "~/hooks/use-entity-media-upload"

function createContentMediaPath(mediaPath: string) {
  return joinUrlPaths(mediaPath, "content", crypto.randomUUID().slice(0, 8))
}

export function useMediaUpload(mediaPath: string) {
  const { uploadToPath } = useEntityMediaUpload()

  async function uploadFile(file: File, onUploadComplete?: (file: UploadedMediaFile) => void) {
    try {
      const uploaded = await uploadToPath(createContentMediaPath(mediaPath), file)
      onUploadComplete?.(uploaded)
      return uploaded
    } catch (error) {
      toast.error(getErrorMessage(error, "Upload failed"))
    }
  }

  return { uploadFile }
}
