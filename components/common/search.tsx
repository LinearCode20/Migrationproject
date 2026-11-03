"use client"

import { getDomain } from "@dirstack/utils"
import { type HotkeyItem, useDebouncedState, useHotkeys } from "@mantine/hooks"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { LoaderIcon, SearchIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { type ComponentProps, useRef } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "~/components/common/command"
import { Kbd } from "~/components/common/kbd"
import { useSearch } from "~/contexts/search-context"
import { useSession } from "~/lib/auth-client"
import { orpc } from "~/lib/orpc-query"

interface SearchItemProps extends Omit<ComponentProps<typeof CommandItem>, "onSelect"> {
  href: string
  onNavigate: (href: string) => void
}

function SearchItem({ href, onNavigate, children, ...props }: SearchItemProps) {
  return (
    <CommandItem onSelect={() => onNavigate(href)} {...props}>
      <Link
        href={href}
        tabIndex={-1}
        className="absolute inset-0"
        onClick={event => event.preventDefault()}
      />
      {children}
    </CommandItem>
  )
}

interface CommandSectionItem {
  label: string
  href: string
  shortcut?: string
}

interface CommandSection {
  name: string
  items: CommandSectionItem[]
}

/**
 * Reads the URL, so the consumer (providers.tsx) wraps it in `<Suspense>`.
 * See https://dirstarter.com/docs/codebase/caching.
 */
export function Search() {
  const t = useTranslations()
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearch()
  const [q, setQuery] = useDebouncedState("", 250)
  const listRef = useRef<HTMLDivElement>(null)

  const query = q.trim().toLowerCase()
  const hasQuery = query.length > 0
  const isAdmin = session?.user.role === "admin"
  const isAdminPath = isAdmin && pathname.startsWith("/app")
  const hasFeaturedTools = !isAdmin && !hasQuery

  const { data: featuredTools } = useQuery(
    orpc.search.findFeaturedTools.queryOptions({
      enabled: search.isOpen && hasFeaturedTools,
    }),
  )

  const { data, isFetching } = useQuery(
    orpc.search.searchItems.queryOptions({
      input: { query },
      enabled: search.isOpen && hasQuery,
      placeholderData: keepPreviousData,
    }),
  )

  const results = hasQuery ? data : undefined
  const tools = hasFeaturedTools ? featuredTools : results?.tools
  const hasResults = !!(results?.tools.length || results?.categories.length || results?.tags.length)

  function handleOpenChange(open: boolean) {
    if (open) {
      search.open()
    } else {
      search.close()
      setQuery("")
    }
  }

  function navigateTo(path: string) {
    router.push(path)
    handleOpenChange(false)
  }

  const commandSections: CommandSection[] = isAdmin
    ? [
        {
          name: t("navigation.create"),
          items: [
            { label: t("navigation.new_tool"), href: "/app/tools/new", shortcut: "mod+1" },
            { label: t("navigation.new_category"), href: "/app/categories/new", shortcut: "mod+2" },
            { label: t("navigation.new_tag"), href: "/app/tags/new", shortcut: "mod+3" },
            { label: t("navigation.new_post"), href: "/app/posts/new", shortcut: "mod+4" },
          ],
        },
      ]
    : [
        {
          name: t("navigation.quick_links"),
          items: [
            { label: t("navigation.tools"), href: "/" },
            { label: t("navigation.categories"), href: "/categories" },
            { label: t("navigation.tags"), href: "/tags" },
          ],
        },
      ]

  const hotkeys: HotkeyItem[] = [["mod+K", () => search.open()]]

  for (const { href, shortcut } of commandSections.flatMap(({ items }) => items)) {
    if (shortcut) {
      hotkeys.push([shortcut, () => navigateTo(href)])
    }
  }

  useHotkeys(hotkeys, [], true)

  return (
    <CommandDialog
      open={search.isOpen}
      title={t("components.search.button_label")}
      shouldFilter={false}
      onOpenChange={handleOpenChange}
    >
      <CommandInput
        placeholder={t("components.search.placeholder")}
        maxLength={100}
        prefix={isFetching ? <LoaderIcon className="animate-spin" /> : undefined}
        suffix={<Kbd keys={["mod", "K"]} />}
        className="pr-10"
        onValueChange={value => {
          setQuery(value)
          listRef.current?.scrollTo({ top: 0, behavior: "smooth" })
        }}
      />

      {hasQuery && !isFetching && <CommandEmpty>{t("components.search.no_results")}</CommandEmpty>}

      <CommandList ref={listRef}>
        {!hasQuery &&
          commandSections.map(({ name, items }) => (
            <CommandGroup key={name} heading={name}>
              {items.map(({ label, href, shortcut }) => (
                <SearchItem key={href} value={label} href={href} onNavigate={navigateTo}>
                  <span className="flex-1 truncate">{label}</span>
                  {shortcut && <CommandShortcut keys={shortcut.split("+")} />}
                </SearchItem>
              ))}
            </CommandGroup>
          ))}

        {!!tools?.length && (
          <CommandGroup heading={t(`navigation.${hasFeaturedTools ? "featured_tools" : "tools"}`)}>
            {tools.map(({ id, slug, name, faviconUrl, websiteUrl }) => (
              <SearchItem
                key={slug}
                value={`tools:${slug}`}
                href={isAdminPath ? `/app/tools/${id}` : `/${slug}`}
                onNavigate={navigateTo}
              >
                {faviconUrl && <Image src={faviconUrl} alt="" width={16} height={16} />}
                <span className="flex-1 truncate">{name}</span>
                <span className="opacity-50">{getDomain(websiteUrl)}</span>
              </SearchItem>
            ))}
          </CommandGroup>
        )}

        {!!results?.categories.length && (
          <CommandGroup heading={t("navigation.categories")}>
            {results.categories.map(({ id, slug, name }) => (
              <SearchItem
                key={slug}
                value={`categories:${slug}`}
                href={isAdminPath ? `/app/categories/${id}` : `/categories/${slug}`}
                onNavigate={navigateTo}
              >
                {name}
              </SearchItem>
            ))}
          </CommandGroup>
        )}

        {!!results?.tags.length && (
          <CommandGroup heading={t("navigation.tags")}>
            {results.tags.map(({ id, slug, name }) => (
              <SearchItem
                key={slug}
                value={`tags:${slug}`}
                href={isAdminPath ? `/app/tags/${id}` : `/tags/${slug}`}
                onNavigate={navigateTo}
              >
                {name}
              </SearchItem>
            ))}
          </CommandGroup>
        )}

        {hasResults && (
          <CommandGroup>
            <SearchItem
              value="search:all"
              href={`/?q=${encodeURIComponent(q.trim())}`}
              onNavigate={navigateTo}
            >
              <SearchIcon />
              <span className="flex-1 truncate">{t("components.search.see_all")}</span>
            </SearchItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
