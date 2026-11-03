import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages, getTimeZone } from "next-intl/server"
import { ThemeProvider } from "next-themes"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { type PropsWithChildren, Suspense } from "react"
import { QueryProvider } from "~/components/common/providers/query-provider"
import { Search } from "~/components/common/search"
import { Toaster } from "~/components/common/toaster"
import { TooltipProvider } from "~/components/common/tooltip"
import { LoginMethodsProvider } from "~/contexts/login-methods-context"
import { SearchProvider } from "~/contexts/search-context"
import { enabledSocialProviders } from "~/lib/auth"

export async function Providers({ children }: PropsWithChildren) {
  const locale = await getLocale()
  const messages = await getMessages()
  const timeZone = await getTimeZone()

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      <NuqsAdapter>
        <TooltipProvider delay={250}>
          <SearchProvider>
            <ThemeProvider attribute="class" disableTransitionOnChange>
              <QueryProvider>
                <LoginMethodsProvider socialProviders={enabledSocialProviders}>
                  {children}
                  <Toaster />

                  <Suspense fallback={null}>
                    <Search />
                  </Suspense>
                </LoginMethodsProvider>
              </QueryProvider>
            </ThemeProvider>
          </SearchProvider>
        </TooltipProvider>
      </NuqsAdapter>
    </NextIntlClientProvider>
  )
}
