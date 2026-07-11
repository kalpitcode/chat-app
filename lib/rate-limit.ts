type RateLimitWindow = {
  count: number
  resetAt: number
}

const memoryStore = new Map<string, RateLimitWindow>()

export function enforceRateLimit(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now()
  const currentWindow = memoryStore.get(key)

  if (!currentWindow || currentWindow.resetAt <= now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs
    })
    return
  }

  if (currentWindow.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((currentWindow.resetAt - now) / 1000))
    const error = new Error("Too many requests")
    ;(error as Error & { status?: number; retryAfterSeconds?: number }).status = 429
    ;(error as Error & { status?: number; retryAfterSeconds?: number }).retryAfterSeconds = retryAfterSeconds
    throw error
  }

  currentWindow.count += 1
  memoryStore.set(key, currentWindow)
}

export function resetRateLimitStore() {
  memoryStore.clear()
}
