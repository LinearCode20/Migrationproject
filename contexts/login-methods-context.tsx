"use client"

import { createContext, type PropsWithChildren, use } from "react"
import type { SocialProvider } from "~/lib/auth-client"

interface LoginMethodsContextType {
  socialProviders: SocialProvider[]
}

const LoginMethodsContext = createContext<LoginMethodsContextType | null>(null)

interface LoginMethodsProviderProps {
  socialProviders: SocialProvider[]
}

/**
 * Shares the site-wide sign-in methods resolved on the server with the login UI. The
 * login dialog opens inside client components on cached pages, so a context reaches it
 * without a request and without exposing the provider credentials to the client.
 */
export function LoginMethodsProvider({
  children,
  socialProviders,
}: PropsWithChildren<LoginMethodsProviderProps>) {
  return (
    <LoginMethodsContext.Provider value={{ socialProviders }}>
      {children}
    </LoginMethodsContext.Provider>
  )
}

/** The sign-in methods from the nearest `LoginMethodsProvider`, or none outside one. */
export function useLoginMethods() {
  const context = use(LoginMethodsContext)

  if (!context) {
    return { socialProviders: [] }
  }

  return context
}
