"use client"

import { useEffect } from "react"
import type { DefaultValues, FieldValues, UseFormReturn } from "react-hook-form"

/**
 * Keeps a form's values in the browser while the visitor leaves the page, such as for sign-in,
 * and restores them once on the next visit. It stores every field, so fields added to the form
 * later are kept too, and the values never reach a URL or the server.
 *
 * @param form - The form whose values to keep.
 * @param key - A name for the draft, unique per form.
 * @returns `saveDraft` to store the current values and `clearDraft` to drop them.
 */
export function useFormDraft<T extends FieldValues>(form: UseFormReturn<T>, key: string) {
  const storageKey = `form-draft:${key}`

  useEffect(() => {
    try {
      const draft = localStorage.getItem(storageKey)

      if (!draft) {
        return
      }

      localStorage.removeItem(storageKey)
      form.reset({ ...form.getValues(), ...JSON.parse(draft) } as DefaultValues<T>)
    } catch {}
  }, [form, storageKey])

  function saveDraft() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(form.getValues()))
    } catch {}
  }

  function clearDraft() {
    try {
      localStorage.removeItem(storageKey)
    } catch {}
  }

  return { saveDraft, clearDraft }
}
