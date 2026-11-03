import { compact, uniq } from "@dirstack/utils"
import { useDebouncedValue } from "@mantine/hooks"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { LoaderIcon, PlusIcon } from "lucide-react"
import { AnimatePresence } from "motion/react"
import { useState } from "react"
import { AnimatedContainer } from "~/components/common/animated-container"
import { Badge } from "~/components/common/badge"
import { RelationSelector, type RelationSelectorProps } from "~/components/common/relation-selector"
import { Stack } from "~/components/common/stack"
import { Tooltip } from "~/components/common/tooltip"
import { useAI } from "~/contexts/ai-context"
import { useCan } from "~/contexts/user-context"
import { client } from "~/lib/orpc-client"

interface AIRelationSuggestionsProps extends RelationSelectorProps {
  prompt?: string
  maxSuggestions?: number
}

function buildSuggestionPrompt(prompt: string, maxSuggestions: number, relationNames: string) {
  return `
${prompt}

Only return the relation names in comma-separated format, and nothing else.
If there are no relevant relations, return an empty string.
Sort the relations by relevance to the link.
Suggest only ${maxSuggestions} relations at most.

Available relations: ${relationNames}
`
}

/** Expands the loader and the suggestion row in, and collapses them out on removal. */
const presenceProps = {
  initial: { height: 0, opacity: 0 },
  exit: { height: 0, opacity: 0 },
} as const

export function AIRelationSuggestions({
  relations,
  ids,
  setIds,
  prompt,
  maxSuggestions = 5,
  ...props
}: AIRelationSuggestionsProps) {
  const { isAIEnabled } = useAI()
  const canUseAI = useCan("ai.use")
  const [debouncedPrompt] = useDebouncedValue(prompt, 500)
  const relationNames = relations.map(({ name }) => name).join(", ")

  // Once suggestions are on screen the prompt is frozen, so further typing
  // does not fire a new request until the list is emptied.
  const [frozenPrompt, setFrozenPrompt] = useState<string>()
  const activePrompt = frozenPrompt ?? debouncedPrompt

  const { data, isFetching } = useQuery({
    queryKey: ["ai-suggest", activePrompt, relationNames, maxSuggestions],
    queryFn: async ({ signal }) => {
      const { text } = await client.ai.completion(
        { prompt: buildSuggestionPrompt(activePrompt ?? "", maxSuggestions, relationNames) },
        { signal },
      )

      const matched = text
        .split(",")
        .map(name => relations.find(relation => relation.name === name.trim()))

      const result = compact(uniq(matched)).slice(0, maxSuggestions)
      if (result.length) {
        setFrozenPrompt(activePrompt)
      }
      return result
    },
    enabled: isAIEnabled && canUseAI && !!activePrompt && relations.length > 0 && ids.length === 0,
    staleTime: Number.POSITIVE_INFINITY,
    placeholderData: keepPreviousData,
    retry: false,
  })

  const suggestions = data?.filter(({ id }) => !ids.includes(id)) ?? []

  if (frozenPrompt !== undefined && !suggestions.length && !isFetching) {
    setFrozenPrompt(undefined)
  }

  return (
    <RelationSelector relations={relations} ids={ids} setIds={setIds} {...props}>
      <AnimatePresence initial={false}>
        {isAIEnabled && isFetching && (
          <AnimatedContainer key="loading" {...presenceProps}>
            <Stack size="xs" className="text-xs">
              <LoaderIcon className="animate-spin" />
              <span className="text-muted-foreground">Generating suggestions...</span>
            </Stack>
          </AnimatedContainer>
        )}

        {isAIEnabled && !!suggestions.length && (
          <AnimatedContainer key="suggestions" {...presenceProps}>
            <Stack size="sm" direction="row" className="items-start">
              <Tooltip tooltip="AI-suggested relations. Click on them to add to the selection.">
                <div className="mt-0.5 text-xs cursor-help opacity-50">Suggested:</div>
              </Tooltip>

              <Stack size="xs" className="flex-1">
                {suggestions.map(relation => (
                  <Badge
                    key={relation.id}
                    size="sm"
                    variant="warning"
                    prefix={<PlusIcon />}
                    render={
                      <button
                        type="button"
                        aria-label={`Add ${relation.name}`}
                        onClick={() => setIds([...ids, relation.id])}
                      />
                    }
                  >
                    {relation.name}
                  </Badge>
                ))}
              </Stack>
            </Stack>
          </AnimatedContainer>
        )}
      </AnimatePresence>
    </RelationSelector>
  )
}
