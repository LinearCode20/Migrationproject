"use client"

import { useResizeObserver } from "@mantine/hooks"
import { type HTMLMotionProps, motion, useReducedMotion } from "motion/react"
import type { PropsWithChildren } from "react"
import { slot } from "~/lib/slot"
import { cx } from "~/lib/utils"

type AnimatedContainerProps = PropsWithChildren<
  Omit<HTMLMotionProps<"div">, "animate" | "children" | "transition">
>

export function AnimatedContainer({ children, className, ...props }: AnimatedContainerProps) {
  const [ref, rect] = useResizeObserver()
  // Reduced motion only swaps the transition, so the server and client render the same markup.
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      transition={shouldReduceMotion ? { duration: 0 } : { ease: "linear", duration: 0.1 }}
      animate={{ height: rect.height, opacity: 1 }}
      className={cx("overflow-hidden", className)}
      {...props}
    >
      <div ref={ref} className="h-max">
        {slot(children, { className: "animate-fade-in" })}
      </div>
    </motion.div>
  )
}
