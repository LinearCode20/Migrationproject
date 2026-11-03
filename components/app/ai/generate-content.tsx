import { isValidUrl } from "@dirstack/utils"
import type { ComponentProps } from "react"
import type { z } from "zod"
import { AIGenerate } from "~/components/app/ai/generate"
import type { Button } from "~/components/common/button"
import { useAIGenerate } from "~/hooks/use-ai-generate"
import { client } from "~/lib/orpc-client"
import type { contentSchema } from "~/server/ai/schema"

interface AIGenerateContentProps extends ComponentProps<typeof Button> {
  url: string
  onGenerate?: () => void
  onFinish?: () => void
  onComplete: (result: z.infer<typeof contentSchema>) => void
}

export function AIGenerateContent({
  url,
  onGenerate,
  onFinish,
  onComplete,
  ...props
}: AIGenerateContentProps) {
  const { isLoading, start, stop } = useAIGenerate({
    generate: (signal, options) => client.ai.content({ url, ...options }, { signal }),
    onGenerate,
    onFinish,
    onComplete,
  })

  return (
    <AIGenerate
      stop={stop}
      isLoading={isLoading}
      buttonText="Generate Content"
      showCacheOption
      disabledReason={!isValidUrl(url) && "Enter a valid website URL first"}
      onStart={start}
      {...props}
    />
  )
}
