import { describe, expect, it } from "vitest"
import { enforceRateLimit, resetRateLimitStore } from "@/lib/rate-limit"

describe("enforceRateLimit", () => {
  it("allows requests under the limit", () => {
    resetRateLimitStore()

    expect(() => enforceRateLimit("send:user-1", 2, 60_000)).not.toThrow()
    expect(() => enforceRateLimit("send:user-1", 2, 60_000)).not.toThrow()
  })

  it("throws once the limit is exceeded", () => {
    resetRateLimitStore()

    enforceRateLimit("send:user-2", 1, 60_000)

    expect(() => enforceRateLimit("send:user-2", 1, 60_000)).toThrow("Too many requests")
  })
})
