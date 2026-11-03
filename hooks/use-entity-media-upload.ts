"use client"

import { toBase64 } from "@dirstack/utils"
import { useTranslations } from "next-intl"
import { useRef, useState } from "react"
import { client } from "~/lib/orpc-client"
import { createFileSchema } from "~/server/shared/form-schemas"

export interface UploadedMediaFile {
  key: string
  url: string
  name: string
  size: number
  type: string
}

async function getBase64Payload(file: File) {
  return await toBase64(file)
}

export function useEntityMediaUpload() {
  const t = useTranslations("schema")
  const fileSchema = createFileSchema(t)
  const activeUploads = useRef(new Set<string>())
  const [isUploading, setIsUploading] = useState(false)

  async function uploadToPath(
    path: string,
    file: File,
    type?: "favicon" | "screenshot",
  ): Promise<UploadedMediaFile> {
    const { data, error } = await fileSchema.safeParseAsync(file)

    if (error) {
      throw new Error(error.issues[0]?.message ?? "Upload failed")
    }

    if (activeUploads.current.has(path)) {
      throw new Error("Upload already in progress")
    }

    activeUploads.current.add(path)
    setIsUploading(true)

    try {
      const base64 = await getBase64Payload(data)
      const url = await client.media.upload({ path, base64, type })

      if (!url) {
        throw new Error("Upload failed: no URL returned")
      }

      return {
        key: path,
        url,
        name: data.name,
        size: data.size,
        type: data.type,
      }
    } finally {
      activeUploads.current.delete(path)
      setIsUploading(activeUploads.current.size > 0)
    }
  }

  return { uploadToPath, isUploading }
}
