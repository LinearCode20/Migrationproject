import { setQueryParams } from "@dirstack/utils"
import { Button, type ButtonProps } from "@react-email/components"
import { siteConfig } from "~/config/site"

export function EmailButton({ className, href, ...props }: ButtonProps) {
  return (
    <Button
      href={setQueryParams(href!, { ref: siteConfig.domain })}
      className={`my-4 rounded-md bg-neutral-950 px-5 py-2.5 text-center text-sm font-medium text-white no-underline ${className ?? ""}`}
      {...props}
    />
  )
}
