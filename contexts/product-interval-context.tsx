"use client"

import { useLocalStorage } from "@mantine/hooks"
import { createContext, type PropsWithChildren, use, useMemo } from "react"
import { siteConfig } from "~/config/site"
import type { ProductInterval } from "~/lib/products"

export const listingIntervals: ProductInterval[] = ["month", "year"]

interface ProductIntervalContextType {
  intervals: ProductInterval[]
  interval: ProductInterval
  setInterval: (value: ProductInterval) => void
  showSwitch: boolean
}

const ProductIntervalContext = createContext<ProductIntervalContextType>(null!)

export function ProductIntervalProvider({
  intervals,
  showSwitch = true,
  children,
}: PropsWithChildren<{ intervals: ProductInterval[]; showSwitch?: boolean }>) {
  const [stored, setStored] = useLocalStorage<ProductInterval>({
    key: `${siteConfig.slug}-product-interval`,
    defaultValue: "month",
  })

  const interval = intervals.includes(stored) ? stored : intervals[0]

  const value = useMemo(
    () => ({ intervals, interval, setInterval: setStored, showSwitch }),
    [intervals, interval, setStored, showSwitch],
  )

  return <ProductIntervalContext.Provider value={value}>{children}</ProductIntervalContext.Provider>
}

export function useProductInterval() {
  const context = use(ProductIntervalContext)

  if (context === undefined) {
    throw new Error("useProductInterval must be used within a ProductIntervalProvider")
  }

  return context
}
