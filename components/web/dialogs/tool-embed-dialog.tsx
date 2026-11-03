import { CheckIcon, ClipboardIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { FormProvider as Form, useForm, useWatch } from "react-hook-form"
import { Button } from "~/components/common/button"
import { Card } from "~/components/common/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/common/dialog"
import { FormField } from "~/components/common/field"
import { Input } from "~/components/common/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/common/select"
import { TextArea } from "~/components/common/textarea"
import { type BadgeThemeName, badgeThemes, imagesConfig } from "~/config/images"
import { siteConfig } from "~/config/site"
import { useCopy } from "~/hooks/use-copy"
import { cx } from "~/lib/utils"
import type { ToolOne } from "~/server/tools/payloads"

interface EmbedForm {
  theme: BadgeThemeName
  width: number
  height: number
}

interface ToolEmbedDialogProps {
  tool: ToolOne
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ToolEmbedDialog({ tool, open, onOpenChange }: ToolEmbedDialogProps) {
  const { badge } = imagesConfig
  const { resolvedTheme } = useTheme()
  const clipboard = useCopy()
  const t = useTranslations("dialogs.embed")
  const tCommon = useTranslations("common")

  const form = useForm<EmbedForm>({
    defaultValues: {
      theme: resolvedTheme as BadgeThemeName,
      width: badge.width.default,
      height: badge.height.default,
    },
    mode: "onChange",
  })

  const [theme, width, height] = useWatch({
    control: form.control,
    name: ["theme", "width", "height"],
  })

  const toolLink = `${siteConfig.url}/${tool.slug}`
  const badgeParams = new URLSearchParams({ theme, width: String(width), height: String(height) })
  const badgeUrl = `${toolLink}/badge.svg?${badgeParams}`

  const utmParams = new URLSearchParams({
    utm_source: siteConfig.slug,
    utm_medium: "badge",
    utm_campaign: "embed",
    utm_content: `tool-${tool.slug}`,
  })

  const embedCode = `<a href="${toolLink}?${utmParams}" target="_blank"><img src="${badgeUrl}" width="${width}" height="${height}" alt="${tool.name} badge" loading="lazy" /></a>`

  const previewBg = theme === "dark" ? "bg-black" : "bg-white"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("title", { toolName: tool.name })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            autoComplete="off"
            className="grid w-full gap-x-3 gap-y-5 sm:grid-cols-3"
            onSubmit={event => event.preventDefault()}
          >
            <FormField control={form.control} name="theme" label={t("theme_label")}>
              {({ field, controlProps }) => (
                <Select
                  value={field.value}
                  items={badgeThemes.map(theme => ({
                    value: theme,
                    label: tCommon(`themes.${theme}`),
                  }))}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger {...controlProps}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {badgeThemes.map(theme => (
                      <SelectItem key={theme} value={theme}>
                        {tCommon(`themes.${theme}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <FormField control={form.control} name="width" label={t("width_label")}>
              <Input
                type="number"
                min={badge.width.min}
                max={badge.width.max}
                step={badge.width.step}
              />
            </FormField>

            <FormField control={form.control} name="height" label={t("height_label")}>
              <Input
                type="number"
                min={badge.height.min}
                max={badge.height.max}
                step={badge.height.step}
              />
            </FormField>

            <div className="col-span-full">
              <div className="text-xs mb-1 text-muted-foreground">{t("preview_label")}</div>
              <Card
                className={cx(
                  "flex items-center justify-center min-h-20 bg-background overflow-clip",
                  previewBg,
                )}
              >
                <img
                  src={badgeUrl}
                  width={width}
                  height={height}
                  alt={t("preview_alt", { name: tool.name })}
                  draggable={false}
                  className="block"
                />
              </Card>
            </div>

            <div className="col-span-full">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="text-xs text-muted-foreground">{t("code_label")}</div>

                <Button
                  size="sm"
                  variant="secondary"
                  prefix={clipboard.copied ? <CheckIcon /> : <ClipboardIcon />}
                  className={cx(clipboard.copied && "text-success-text")}
                  onClick={() => clipboard.copy(embedCode)}
                >
                  {clipboard.copied ? t("copied") : t("copy_button")}
                </Button>

                {/* The button's label swaps silently; this announces the copy. */}
                <output className="sr-only">{clipboard.copied && t("copied")}</output>
              </div>

              <TextArea
                value={embedCode}
                readOnly
                rows={4}
                className="block w-full font-mono text-xs cursor-pointer field-sizing-fixed"
                onFocus={event => event.target.select()}
              />
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
