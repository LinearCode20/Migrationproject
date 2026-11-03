"use client"

import { createContext, type PropsWithChildren, use } from "react"
import type { SessionUser } from "~/server/orpc/context"
import { can } from "~/server/orpc/permissions"
import type { Permission } from "~/server/orpc/roles"

const UserContext = createContext<SessionUser | null>(null)

interface UserProviderProps {
  user: SessionUser | null
}

/**
 * Shares the signed-in user resolved by the `/app` layout with client
 * components, so they can gate controls without fetching the session again.
 */
export function UserProvider({ children, user }: PropsWithChildren<UserProviderProps>) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

/** The signed-in user from the nearest `UserProvider`, or `null` outside one. */
export function useUser() {
  return use(UserContext)
}

/**
 * Can the current user perform `permission`? The client-side counterpart of the
 * procedure gate, backed by the same `can()`. Outside a `UserProvider` the user is
 * treated as a guest.
 */
export function useCan(permission: Permission) {
  return can(use(UserContext), permission)
}
