import { describe, expect, it } from "vitest"
import {
  loginSchema,
  maxAttachmentSizeBytes,
  signupSchema,
  validateAttachment,
} from "@/lib/validators"

describe("signupSchema", () => {
  it("accepts a strong password", () => {
    const result = signupSchema.safeParse({
      name: "Kalpit Code",
      email: "kalpit@example.com",
      password: "Strong123",
      role: "mentee"
    })

    expect(result.success).toBe(true)
  })

  it("rejects a weak password", () => {
    const result = signupSchema.safeParse({
      name: "Kalpit Code",
      email: "kalpit@example.com",
      password: "weakpass",
      role: "mentee"
    })

    expect(result.success).toBe(false)
  })
})

describe("loginSchema", () => {
  it("rejects short passwords", () => {
    const result = loginSchema.safeParse({
      email: "kalpit@example.com",
      password: "short"
    })

    expect(result.success).toBe(false)
  })
})

describe("validateAttachment", () => {
  it("accepts supported files within the limit", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "photo.png", {
      type: "image/png"
    })

    expect(() => validateAttachment(file)).not.toThrow()
  })

  it("rejects unsupported file types", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "archive.zip", {
      type: "application/zip"
    })

    expect(() => validateAttachment(file)).toThrow("Unsupported file type")
  })

  it("rejects oversize files", () => {
    const file = new File([new Uint8Array(maxAttachmentSizeBytes + 1)], "huge.png", {
      type: "image/png"
    })

    expect(() => validateAttachment(file)).toThrow("File is too large")
  })
})
