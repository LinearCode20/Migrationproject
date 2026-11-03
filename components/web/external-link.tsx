"use client"

import { compact, isExternalUrl, setQueryParams } from "@dirstack/utils"
import type { Register } from "highseat"
import type { ComponentProps, MouseEventHandler } from "react"
import { siteConfig } from "~/config/site"
import { useTrackEvent } from "~/hooks/use-track-event"

type LinkEvents = Pick<Register["events"], "click_website" | "click_share" | "click_ad">

// One variant per event, so a name only accepts its own properties.
type LinkEvent = {
  [Name in keyof LinkEvents]: { eventName: Name; eventProps: LinkEvents[Name] }
}[keyof LinkEvents]

export interface ExternalLinkBaseProps extends ComponentProps<"a"> {
  doTrack?: boolean
  doFollow?: boolean
  /** Marks a paid link (an ad or an affiliate link) with `rel="sponsored"`. */
  sponsored?: boolean
}

type ExternalLinkProps = ExternalLinkBaseProps &
  (LinkEvent | { eventName?: never; eventProps?: never })

export function ExternalLink({
  href,
  target = "_blank",
  doTrack = false,
  doFollow = false,
  sponsored = false,
  eventName,
  eventProps,
  onClick,
  ...props
}: ExternalLinkProps) {
  const trackEvent = useTrackEvent()
  const addTracking = doTrack && !href?.includes("utm_source")
  const finalHref = addTracking ? setQueryParams(href!, { utm_source: siteConfig.domain }) : href
  const isExternal = isExternalUrl(finalHref)
  const rel = compact(["noopener", !doFollow && "nofollow", sponsored && "sponsored"]).join(" ")

  const handleClick: MouseEventHandler<HTMLAnchorElement> = event => {
    if (isExternal && eventName) {
      trackEvent(eventName, eventProps)
    }

    onClick?.(event)
  }

  return <a href={finalHref!} target={target} rel={rel} onClick={handleClick} {...props} />
}
