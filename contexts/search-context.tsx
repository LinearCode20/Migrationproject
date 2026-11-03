"use client"

import { createContext, type PropsWithChildren, use, useCallback, useMemo, useState } from "react"

interface SearchContextType {
  isOpen: boolean
  open: () => void
  close: () => void
}

const SearchContext = createContext<SearchContextType>(null!)

export function SearchProvider(props: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close])

  return <SearchContext.Provider value={value} {...props} />
}

export function useSearch() {
  const context = use(SearchContext)

  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider")
  }

  return context
}
