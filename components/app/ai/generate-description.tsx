import type { ComponentProps } from "react"
import type { z } from "zod"
import { AIGenerate } from "~/components/app/ai/generate"
import type { Button } from "~/components/common/button"
import { useAIGenerate } from "~/hooks/use-ai-generate"
import { client } from "~/lib/orpc-client"
import type { descriptionSchema } from "~/server/ai/schema"

interface AIGenerateDescriptionProps
  extends ComponentProps<typeof Button>, Pick<ComponentProps<typeof AIGenerate>, "disabledReason"> {
  prompt?: string
  onGenerate?: () => void
  onFinish?: () => void
  onComplete: (result: z.infer<typeof descriptionSchema>) => void
}

export function AIGenerateDescription({
  prompt = "",
  onGenerate,
  onFinish,
  onComplete,
  ...props
}: AIGenerateDescriptionProps) {
  const { isLoading, start, stop } = useAIGenerate({
    generate: (signal, options) => client.ai.description({ prompt, ...options }, { signal }),
    onGenerate,
    onFinish,
    onComplete,
  })

  return (
    <AIGenerate
      stop={stop}
      isLoading={isLoading}
      buttonText="Generate Description"
      onStart={start}
      {...props}
    />
  )
}
