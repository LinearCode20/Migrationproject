import { ArrowRightIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import type { ComponentProps } from "react"
import { Button } from "~/components/common/button"
import { H2 } from "~/components/common/heading"
import { Skeleton } from "~/components/common/skeleton"
import { Stack } from "~/components/common/stack"
import { Markdown } from "~/components/web/markdown"
import { OverlayImage } from "~/components/web/overlay-image"
import { ToolButton } from "~/components/web/tools/tool-button"
import { ToolVerifiedBadge } from "~/components/web/tools/tool-verified-badge"
import { Backdrop } from "~/components/web/ui/backdrop"
import { Favicon } from "~/components/web/ui/favicon"
import { Sticky } from "~/components/web/ui/sticky"
import { hasToolTierCap, isToolDoFollowUrl } from "~/lib/tools"
import { cx } from "~/lib/utils"
import type { ToolOne } from "~/server/tools/payloads"

interface ToolEntryProps extends ComponentProps<"div"> {
  tool: ToolOne
}

/**
 * A long-form tool block for articles and listing pages. Consecutive entries number themselves
 * through the `entries` CSS counter. Children replace the tool's own Markdown content.
 */
export async function ToolEntry({ children, className, tool, ...props }: ToolEntryProps) {
  const t = await getTranslations()
  const href = `/${tool.slug}`
  const isFeatured = hasToolTierCap(tool, "featuredPlacement")

  return (
    <div
      className={cx(
        "relative flex flex-col gap-6 scroll-mt-(--header-outer-offset) md:gap-8 [counter-increment:entries]",
        className,
      )}
      {...props}
    >
      <Sticky isOverlay>
        <Stack size="lg" className="not-prose justify-between">
          <Stack
            className="group self-start before:content-['#'_counter(entries)] before:text-3xl before:font-semibold before:opacity-25 xl:before:absolute xl:before:right-full xl:before:mr-2"
            render={<Link href={href} />}
          >
            <Favicon src={tool.faviconUrl} className="size-8" />

            <H2 className="truncate leading-tight! underline decoration-transparent group-hover:decoration-foreground/30">
              {tool.name}
            </H2>

            <ToolVerifiedBadge tool={tool} size="lg" />
          </Stack>

          <Backdrop />
        </Stack>
      </Sticky>

      {tool.description && (
        <p className="not-prose -mt-2 w-full text-pretty text-secondary-foreground md:-mt-4 md:text-lg">
          {tool.description}
        </p>
      )}

      {tool.screenshotUrl && (
        <OverlayImage
          render={<Link href={href} />}
          src={tool.screenshotUrl}
          alt={t("tools.screenshot_alt", { name: tool.name })}
        />
      )}

      {children ? (
        <div>{children}</div>
      ) : (
        tool.content && (
          <Markdown
            code={tool.content}
            isDoFollowUrl={url => isToolDoFollowUrl(tool, url)}
            className="relative max-h-72 overflow-hidden mask-b-from-80%"
          />
        )
      )}

      <Stack className="not-prose w-full">
        {isFeatured && <ToolButton tool={tool} />}

        <Button
          variant={isFeatured ? "secondary" : "primary"}
          suffix={<ArrowRightIcon />}
          className="self-start"
          render={<Link href={href} />}
        >
          {t("common.read_more")}
        </Button>
      </Stack>
    </div>
  )
}

export async function ToolEntrySkeleton() {
  const t = await getTranslations()

  return (
    <div
      aria-hidden
      className="relative flex flex-col gap-6 scroll-mt-(--header-outer-offset) select-none md:gap-8"
    >
      <Sticky isOverlay>
        <Stack size="lg" className="not-prose justify-between">
          <Stack className="w-full self-start">
            <Favicon src="/favicon.png" className="size-8 animate-pulse opacity-25 grayscale" />

            <H2 className="w-24">
              <Skeleton>&nbsp;</Skeleton>
            </H2>
          </Stack>

          <Backdrop />
        </Stack>
      </Sticky>

      <Stack size="xs" direction="column" className="-mt-2 w-full md:-mt-4 md:text-lg">
        <Skeleton className="w-full">&nbsp;</Skeleton>
        <Skeleton className="w-3/4">&nbsp;</Skeleton>
      </Stack>

      <Skeleton className="aspect-video w-full" />

      <Stack direction="column">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-2/3" />
      </Stack>

      <Button tabIndex={-1} className="pointer-events-none self-start text-transparent opacity-10">
        {t("common.read_more")}
      </Button>
    </div>
  )
}
