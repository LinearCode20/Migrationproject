import { describe, expect, it } from "bun:test"
import { submissionsConfig } from "~/config/submissions"
import { getNextPublishSlot } from "~/lib/tools"

// Wednesday, 2026-10-28, mid-afternoon UTC.
const wednesday = new Date("2026-10-28T15:30:00Z")

describe("getNextPublishSlot", () => {
  it("publishes on the configured weekdays", () => {
    expect(submissionsConfig.publishDays).toEqual([1, 3, 5])
  })

  it("picks the next publish day, never the same day, at midnight UTC", () => {
    expect(getNextPublishSlot([], wednesday).toISOString()).toBe("2026-10-30T00:00:00.000Z")
  })

  it("skips a publish day that a listing already holds", () => {
    const scheduled = [new Date("2026-10-30T00:00:00Z")]

    expect(getNextPublishSlot(scheduled, wednesday).toISOString()).toBe("2026-11-02T00:00:00.000Z")
  })

  it("matches a held day whatever the time of its listing", () => {
    const scheduled = [new Date("2026-10-30T11:59:00Z"), new Date("2026-11-02T23:00:00Z")]

    expect(getNextPublishSlot(scheduled, wednesday).toISOString()).toBe("2026-11-04T00:00:00.000Z")
  })

  it("fills a gap before later scheduled listings", () => {
    const scheduled = [new Date("2026-11-02T00:00:00Z"), new Date("2026-11-04T00:00:00Z")]

    expect(getNextPublishSlot(scheduled, wednesday).toISOString()).toBe("2026-10-30T00:00:00.000Z")
  })
})
