"use client"

import { compact } from "@dirstack/utils"
import { getHotkeyHandler } from "@mantine/hooks"
import { LoaderIcon, SparklesIcon } from "lucide-react"
import { type ComponentProps, useState } from "react"
import { Button } from "~/components/common/button"
import { DisabledReason } from "~/components/common/disabled-reason"
import { Field, FieldLabel } from "~/components/common/field"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/common/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/common/select"
import { Switch } from "~/components/common/switch"
import { TextArea } from "~/components/common/textarea"
import { useAI } from "~/contexts/ai-context"
import { useCan } from "~/contexts/user-context"
import type { GenerateOptions } from "~/hooks/use-ai-generate"
import { cx } from "~/lib/utils"

// Tone is just steering text prepended to the editor's own instructions, so
// the server needs no extra field for it.
const TONE = [
  { value: "default", label: "Default", instruction: "" },
  {
    value: "professional",
    label: "Professional",
    instruction: "Use a professional, matter-of-fact tone.",
  },
  {
    value: "friendly",
    label: "Friendly",
    instruction: "Use a warm, friendly, conversational tone.",
  },
  {
    value: "technical",
    label: "Technical",
    instruction: "Use a precise, technical tone aimed at a developer audience.",
  },
  {
    value: "playful",
    label: "Playful",
    instruction: "Use a light, playful tone while staying informative.",
  },
]

interface AIGenerateProps extends Omit<ComponentProps<typeof Button>, "onClick"> {
  stop: () => void
  isLoading: boolean
  buttonText?: string
  showCacheOption?: boolean
  /** Why generating can't start yet, such as a missing website URL. */
  disabledReason?: string | false
  onStart: (options: GenerateOptions) => void
}

export function AIGenerate({
  stop,
  isLoading,
  buttonText = "Generate",
  showCacheOption = false,
  disabledReason,
  onStart,
  ...props
}: AIGenerateProps) {
  const { isAIEnabled } = useAI()
  const canUseAI = useCan("ai.use")
  const [open, setOpen] = useState(false)
  const [instructions, setInstructions] = useState("")
  const [tone, setTone] = useState("default")
  const [skipCache, setSkipCache] = useState(false)

  const missingRoleReason = canUseAI ? null : "Your role can't use AI features."
  const unavailableReason = isAIEnabled
    ? missingRoleReason
    : "AI features are not configured. Set AI_GATEWAY_API_KEY."

  if (unavailableReason) {
    return (
      <DisabledReason reason={unavailableReason}>
        <Button variant="secondary" size="md" prefix={<SparklesIcon />}>
          <span className="max-md:sr-only">{buttonText}</span>
        </Button>
      </DisabledReason>
    )
  }

  if (isLoading) {
    return (
      <Button
        variant="secondary"
        size="md"
        prefix={<LoaderIcon className="animate-spin" />}
        onClick={stop}
        {...props}
      >
        <span className="max-md:sr-only">Stop Generating</span>
      </Button>
    )
  }

  function handleGenerate() {
    const toneInstruction = TONE.find(option => option.value === tone)?.instruction
    const combined = compact([toneInstruction, instructions.trim()]).join("\n\n")

    setOpen(false)
    onStart({
      instructions: combined || undefined,
      skipCache,
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <DisabledReason reason={disabledReason}>
        <Button
          variant="secondary"
          size="md"
          prefix={<SparklesIcon />}
          render={<PopoverTrigger />}
          {...props}
        >
          <span className="max-md:sr-only">{buttonText}</span>
        </Button>
      </DisabledReason>

      <PopoverContent
        align="end"
        className="flex w-80 flex-col gap-4"
        onKeyDown={getHotkeyHandler([["mod+Enter", handleGenerate]])}
      >
        <Field>
          <FieldLabel htmlFor="ai-instructions">Custom instructions</FieldLabel>
          <TextArea
            id="ai-instructions"
            value={instructions}
            placeholder="Optional. Steer the output, e.g. emphasise pricing, mention the free tier."
            className="min-h-[calc(2lh+1rem+2px)] resize-none"
            onChange={event => setInstructions(event.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="ai-tone">Tone</FieldLabel>
          <Select value={tone} items={TONE} onValueChange={value => setTone(value as string)}>
            <SelectTrigger id="ai-tone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TONE.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {showCacheOption && (
          <Field orientation="horizontal">
            <Switch id="ai-skip-cache" checked={skipCache} onCheckedChange={setSkipCache} />
            <FieldLabel
              htmlFor="ai-skip-cache"
              className={cx("text-xs/snug font-normal", !skipCache && "text-muted-foreground")}
            >
              Re-fetch the website (skip cache)
            </FieldLabel>
          </Field>
        )}

        <Button size="md" onClick={handleGenerate}>
          {buttonText}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
