import { z } from "zod"

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["mentor", "mentee"]).default("mentee")
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export const directChatSchema = z.object({
  contactId: z.string().uuid()
})

export const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000)
})

export const mentorSetupSchema = z.object({
  department: z.string().min(2)
})

export const menteeAssignSchema = z.object({
  mentorId: z.string().uuid()
})
