import { useRef, useState } from "react"
import { toast } from "sonner"

/**
 * Options collected from the generation popover and forwarded to the concrete
 * `generate` call. `skipCache` only applies to generators that scrape a URL
 * (content); others receive it and ignore it.
 */
export interface GenerateOptions {
  instructions?: string
  skipCache: boolean
}

interface UseAIGenerateProps<T> {
  generate: (signal: AbortSignal, options: GenerateOptions) => Promise<T>
  onComplete: (result: T) => void
  onGenerate?: () => void
  onFinish?: () => void
}

/**
 * Drives an abortable AI generation request: tracks loading, surfaces
 * success/error toasts, and exposes a `stop` that truly cancels the in-flight
 * call (the signal threads through to the server). Aborts are not errors.
 */
export function useAIGenerate<T>({
  generate,
  onComplete,
  onGenerate,
  onFinish,
}: UseAIGenerateProps<T>) {
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  function stop() {
    abortRef.current?.abort()
    abortRef.current = null
    setIsLoading(false)
  }

  async function start(options: GenerateOptions) {
    onGenerate?.()
    setIsLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const result = await generate(controller.signal, options)
      onComplete(result)
      toast.success("Content generated successfully. Please save the page to update.")
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return
      }

      console.error(error)
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Something went wrong. Please check the console for more details.",
      )
    } finally {
      abortRef.current = null
      setIsLoading(false)
      onFinish?.()
    }
  }

  return { isLoading, start, stop }
}
