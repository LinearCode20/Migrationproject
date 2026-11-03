import { describe, expect, it } from "bun:test"
import { getNameRank, getRankedPage, getSearchWords, toSearchQuery } from "~/server/shared/search"

describe("getSearchWords", () => {
  it("splits a query on any whitespace", () => {
    expect(getSearchWords("google  analytics\ttool")).toEqual(["google", "analytics", "tool"])
  })

  it("drops repeated words, ignoring case", () => {
    expect(getSearchWords("Google google GOOGLE")).toEqual(["google"])
  })

  it("returns no words for a blank query", () => {
    expect(getSearchWords("   ")).toEqual([])
  })

  it("caps the number of words", () => {
    const query = Array.from({ length: 20 }, (_, index) => `word${index}`).join(" ")
    expect(getSearchWords(query)).toHaveLength(8)
  })

  it("keeps the escaping of an escaped query", () => {
    expect(getSearchWords(toSearchQuery("100% off_line"))).toEqual(["100\\%", "off\\_line"])
  })
})

describe("getNameRank", () => {
  it("ranks an exact match first, ignoring case and extra spaces", () => {
    expect(getNameRank("Google Analytics", "  google   analytics ")).toBe(0)
  })

  it("ranks a prefix before a substring", () => {
    expect(getNameRank("Google Analytics", "google")).toBe(1)
    expect(getNameRank("Google Analytics", "analytics")).toBe(2)
  })

  it("ranks a name with every query word, in any order, before other fields", () => {
    expect(getNameRank("Google Analytics", "analytics google")).toBe(3)
    expect(getNameRank("Google Analytics", "analytics tool")).toBe(4)
  })

  it("ranks a match on other fields last", () => {
    expect(getNameRank("Plausible", "analytics")).toBe(4)
  })
})

describe("getRankedPage", () => {
  const rankedIds = ["a", "b", "c", "d", "e"]

  it("cuts the requested page in rank order", () => {
    expect(getRankedPage(rankedIds, rankedIds, { page: 2, perPage: 2 })).toEqual({
      ids: ["c", "d"],
      total: 5,
    })
  })

  it("drops ids the database filtered out before cutting the page", () => {
    expect(getRankedPage(rankedIds, ["e", "c", "a"], { page: 1, perPage: 2 })).toEqual({
      ids: ["a", "c"],
      total: 3,
    })
  })

  it("returns an empty page past the last one", () => {
    expect(getRankedPage(rankedIds, rankedIds, { page: 4, perPage: 2 })).toEqual({
      ids: [],
      total: 5,
    })
  })
})
