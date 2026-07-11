import { NextResponse } from "next/server"
import { authenticate } from "@/lib/authMiddleware"
import { createAttachmentMessage, ensureDemoData } from "@/lib/chat"
import { enforceRateLimit } from "@/lib/rate-limit"
import { saveAttachment } from "@/lib/uploads"
import { messageUploadCaptionSchema, validateAttachment } from "@/lib/validators"

type RouteContext = {
  params: Promise<{
    chatId: string
  }>
}

export async function POST(req: Request, context: RouteContext) {
  await ensureDemoData()

  const auth = authenticate(req)

  if (auth.error) {
    return auth.error
  }

  try {
    enforceRateLimit(`upload:${auth.user.userId}`, 8, 60_000)
  } catch (error) {
    const retryAfterSeconds = (error as Error & { retryAfterSeconds?: number }).retryAfterSeconds
    return NextResponse.json(
      { error: "Too many uploads sent too quickly" },
      {
        status: 429,
        headers: retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : undefined
      }
    )
  }

  const { chatId } = await context.params
  const formData = await req.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attachment is required" }, { status: 400 })
  }

  try {
    validateAttachment(file)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid attachment" }, { status: 400 })
  }

  const captionParsed = messageUploadCaptionSchema.safeParse({
    content: typeof formData.get("content") === "string" ? formData.get("content") : ""
  })

  if (!captionParsed.success) {
    return NextResponse.json({ error: captionParsed.error.issues[0]?.message || "Invalid caption" }, { status: 400 })
  }

  const savedAttachment = await saveAttachment(file)

  const message = await createAttachmentMessage(chatId, auth.user.userId, {
    content: captionParsed.data.content,
    attachmentName: file.name,
    attachmentSize: file.size,
    attachmentType: file.type,
    attachmentUrl: savedAttachment.publicUrl
  })

  if (!message) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  return NextResponse.json({ message })
}
