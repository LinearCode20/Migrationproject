import { describe, expect, it } from "bun:test"
import { adsConfig, getAdOrder } from "~/config/ads"

/**
 * Ads render after the items, so an ad with CSS `order` k at index i lands at
 * grid slot `k + i + 2`. Tests assert on slots (what a visitor actually sees),
 * rather than on the raw order value.
 */
function slotOf(index: number, columns: number, perPage: number) {
  return getAdOrder(index, columns, perPage) + index + 2
}

const columns = [1, 2, 3]
const perPage = 36 - adsConfig.adsPerPage

describe("getAdOrder: opening row", () => {
  it("closes the opening row in a multi-column grid", () => {
    expect(slotOf(0, 2, perPage)).toBe(2)
    expect(slotOf(0, 3, perPage)).toBe(3)
  })

  it("never leads the opening row, not even in a single column", () => {
    for (const columnCount of columns) {
      expect(slotOf(0, columnCount, perPage)).toBeGreaterThanOrEqual(2)
    }
  })
})

describe("getAdOrder: slot math", () => {
  it("spreads the ads a whole number of rows apart", () => {
    // 34 items + 2 ads across 3 columns: rows 1 and 7 close on an ad.
    expect([0, 1].map(index => slotOf(index, 3, perPage))).toEqual([3, 21])

    // 2 columns: Math.round(34 / 2 / 2) = 9 rows apart.
    expect([0, 1].map(index => slotOf(index, 2, perPage))).toEqual([2, 20])

    // 1 column: Math.round(34 / 2 / 1) = 17 rows apart.
    expect([0, 1].map(index => slotOf(index, 1, perPage))).toEqual([2, 19])
  })

  it("keeps every ad in the same column across rows", () => {
    for (const columnCount of columns) {
      const first = slotOf(0, columnCount, perPage)

      for (let index = 1; index < adsConfig.adsPerPage; index++) {
        expect((slotOf(index, columnCount, perPage) - first) % columnCount).toBe(0)
      }
    }
  })

  it("orders the ads monotonically down the page", () => {
    for (const columnCount of columns) {
      const slots = Array.from({ length: adsConfig.adsPerPage }, (_, index) =>
        slotOf(index, columnCount, perPage),
      )

      expect(slots).toEqual([...slots].sort((first, second) => first - second))
    }
  })

  it("still spaces ads a full row apart on a tiny page", () => {
    // Guards the `Math.max(1, …)` floor: rows can never collapse to 0 and stack
    // every ad into the same slot.
    for (const columnCount of columns) {
      expect(slotOf(1, columnCount, 1)).toBeGreaterThan(slotOf(0, columnCount, 1))
    }
  })
})
