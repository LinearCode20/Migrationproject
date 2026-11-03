import { describe, expect, it } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { useCan, UserProvider, useUser } from "~/contexts/user-context"
import type { SessionUser } from "~/server/orpc/context"
import type { Permission } from "~/server/orpc/roles"

function asUser(role: string) {
  return { id: `${role}-1`, role } as unknown as SessionUser
}

interface ProbeProps {
  permission: Permission
}

function Probe({ permission }: ProbeProps) {
  return String(useCan(permission))
}

function canRender(user: SessionUser | null, permission: Permission) {
  return renderToStaticMarkup(
    <UserProvider user={user}>
      <Probe permission={permission} />
    </UserProvider>,
  )
}

describe("useCan", () => {
  it("lets the admin role do everything", () => {
    expect(canRender(asUser("admin"), "tools.update")).toBe("true")
    expect(canRender(asUser("admin"), "media.write")).toBe("true")
    expect(canRender(asUser("admin"), "ai.use")).toBe("true")
    expect(canRender(asUser("admin"), "users.read")).toBe("true")
  })

  it("follows the user role's grants", () => {
    expect(canRender(asUser("user"), "tools.submit")).toBe("true")
    expect(canRender(asUser("user"), "tools.update")).toBe("false")
    expect(canRender(asUser("user"), "media.write")).toBe("false")
  })

  it("treats a missing user as a guest", () => {
    expect(canRender(null, "tools.read")).toBe("true")
    expect(canRender(null, "tools.update")).toBe("false")
  })

  it("treats components outside a provider as a guest", () => {
    expect(renderToStaticMarkup(<Probe permission="tools.read" />)).toBe("true")
    expect(renderToStaticMarkup(<Probe permission="tools.update" />)).toBe("false")
  })
})

describe("useUser", () => {
  function NameProbe() {
    return useUser()?.id ?? "none"
  }

  it("returns the provider's user", () => {
    const markup = renderToStaticMarkup(
      <UserProvider user={asUser("admin")}>
        <NameProbe />
      </UserProvider>,
    )

    expect(markup).toBe("admin-1")
  })

  it("returns null outside a provider", () => {
    expect(renderToStaticMarkup(<NameProbe />)).toBe("none")
  })
})
