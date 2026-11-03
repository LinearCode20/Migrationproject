"use client"

import { useMounted } from "@mantine/hooks"
import { LaptopIcon, MoonIcon, SunIcon, SunMoonIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import type { ComponentProps, ReactNode } from "react"
import { Button } from "~/components/common/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { Tooltip } from "~/components/common/tooltip"
import { NavLink } from "~/components/web/ui/nav-link"

const themeIcons: Record<string, ReactNode> = {
  light: <SunIcon />,
  dark: <MoonIcon />,
  system: <LaptopIcon />,
}

function getThemeIcon(theme?: string) {
  return themeIcons[theme ?? "system"] ?? themeIcons.system
}

interface ThemeSwitcherProps extends ComponentProps<typeof DropdownMenuTrigger> {
  tooltip?: ReactNode
}

export function ThemeSwitcher({ tooltip, ...props }: ThemeSwitcherProps) {
  const t = useTranslations()
  const { themes, theme, setTheme, resolvedTheme, forcedTheme } = useTheme()
  const mounted = useMounted()

  if (forcedTheme) {
    return null
  }

  // The theme is only known on the client, so a disabled placeholder holds the slot until mount.
  const triggerIcon = mounted ? getThemeIcon(resolvedTheme) : <SunMoonIcon />

  return (
    <DropdownMenu>
      <Tooltip tooltip={tooltip}>
        <DropdownMenuTrigger
          render={<Button size="sm" variant="ghost" />}
          disabled={!mounted}
          aria-label={t("navigation.toggle_theme")}
          {...props}
        >
          {triggerIcon}
        </DropdownMenuTrigger>
      </Tooltip>

      <DropdownMenuContent align="start">
        {themes.map(option => (
          <NavLink
            key={option}
            isActive={theme === option}
            isPadded={false}
            prefix={getThemeIcon(option)}
            render={<DropdownMenuItem onClick={() => setTheme(option)} />}
          >
            {t(`common.themes.${option}`)}
          </NavLink>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
