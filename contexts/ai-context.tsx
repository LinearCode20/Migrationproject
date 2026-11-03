"use client"

import { createContext, type PropsWithChildren, use } from "react"

interface AIContextType {
  isAIEnabled: boolean
}

const AIContext = createContext<AIContextType | null>(null)

interface AIProviderProps {
  isAIEnabled: boolean
}

export function AIProvider({ children, isAIEnabled }: PropsWithChildren<AIProviderProps>) {
  return <AIContext.Provider value={{ isAIEnabled }}>{children}</AIContext.Provider>
}

export function useAI() {
  const context = use(AIContext)

  if (!context) {
    return { isAIEnabled: false }
  }

  return context
}
