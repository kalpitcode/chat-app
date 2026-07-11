import { beforeEach, describe, expect, it, vi } from "vitest"

const mockedModules = vi.hoisted(() => ({
  authenticate: vi.fn(),
  ensureDemoData: vi.fn(),
  updateOwnMessage: vi.fn(),
  deleteOwnMessage: vi.fn(),
  enforceRateLimit: vi.fn()
}))

vi.mock("@/lib/authMiddleware", () => ({
  authenticate: mockedModules.authenticate
}))

vi.mock("@/lib/chat", () => ({
  ensureDemoData: mockedModules.ensureDemoData,
  updateOwnMessage: mockedModules.updateOwnMessage,
  deleteOwnMessage: mockedModules.deleteOwnMessage
}))

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: mockedModules.enforceRateLimit
}))

import { DELETE, PATCH } from "@/app/api/messages/[messageId]/route"

describe("message route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedModules.authenticate.mockReturnValue({
      user: {
        userId: "user-1",
        role: "mentee"
      }
    })
  })

  it("patches a message successfully", async () => {
    mockedModules.updateOwnMessage.mockResolvedValue({
      id: "message-1",
      content: "Updated copy"
    })

    const response = await PATCH(
      new Request("http://localhost/api/messages/message-1", {
        method: "PATCH",
        body: JSON.stringify({ content: "Updated copy" }),
        headers: { "Content-Type": "application/json" }
      }),
      {
        params: Promise.resolve({ messageId: "message-1" })
      }
    )

    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.message.id).toBe("message-1")
  })

  it("rejects invalid patch payloads", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/messages/message-1", {
        method: "PATCH",
        body: JSON.stringify({ content: "" }),
        headers: { "Content-Type": "application/json" }
      }),
      {
        params: Promise.resolve({ messageId: "message-1" })
      }
    )

    expect(response.status).toBe(400)
  })

  it("deletes a message successfully", async () => {
    mockedModules.deleteOwnMessage.mockResolvedValue({
      id: "message-1"
    })

    const response = await DELETE(
      new Request("http://localhost/api/messages/message-1", {
        method: "DELETE"
      }),
      {
        params: Promise.resolve({ messageId: "message-1" })
      }
    )

    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.message.id).toBe("message-1")
  })
})
