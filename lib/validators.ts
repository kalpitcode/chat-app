import { z } from "zod"

export const allowedAttachmentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const

export const maxAttachmentSizeBytes = 5 * 1024 * 1024

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .max(64)
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[a-z]/, "Password must include at least one lowercase letter")
    .regex(/\d/, "Password must include at least one number"),
  role: z.enum(["mentor", "mentee"]).default("mentee")
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64)
})

export const directChatSchema = z.object({
  contactId: z.string().uuid()
})

export const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000)
})

export const messageUpdateSchema = z.object({
  content: z.string().trim().min(1).max(2000)
})

export const messageUploadCaptionSchema = z.object({
  content: z.string().trim().max(2000).optional().default("")
})

export const mentorSetupSchema = z.object({
  department: z.string().min(2)
})

export const menteeAssignSchema = z.object({
  mentorId: z.string().uuid()
})

export function validateAttachment(file: File) {
  if (!allowedAttachmentTypes.includes(file.type as (typeof allowedAttachmentTypes)[number])) {
    throw new Error("Unsupported file type")
  }

  if (file.size > maxAttachmentSizeBytes) {
    throw new Error("File is too large")
  }
}
