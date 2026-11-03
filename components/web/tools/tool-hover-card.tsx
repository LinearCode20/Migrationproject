"use client"

import type { ComponentProps } from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/components/common/hover-card"
import { ToolCard } from "~/components/web/tools/tool-card"
import type { ToolMany } from "~/server/tools/payloads"

interface ToolHoverCardProps extends ComponentProps<typeof HoverCardTrigger> {
  tool: ToolMany
}

export function ToolHoverCard({ tool, delay = 250, closeDelay = 0, ...props }: ToolHoverCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger delay={delay} closeDelay={closeDelay} {...props} />
      <HoverCardContent align="start" render={<ToolCard tool={tool} isRevealed={false} />} />
    </HoverCard>
  )
}
