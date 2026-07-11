import { NextResponse } from "next/server"
import { authenticate } from "@/lib/authMiddleware"
import { messageSchema } from "@/lib/validators"
import { createTextMessage, ensureDemoData } from "@/lib/chat"
import { enforceRateLimit } from "@/lib/rate-limit"

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

  const { chatId } = await context.params
  const body = await req.json()
  const parsed = messageSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 })
  }

  try {
    enforceRateLimit(`message:${auth.user.userId}`, 20, 60_000)
  } catch (error) {
    const retryAfterSeconds = (error as Error & { retryAfterSeconds?: number }).retryAfterSeconds
    return NextResponse.json(
      { error: "Too many messages sent too quickly" },
      {
        status: 429,
        headers: retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : undefined
      }
    )
  }

  const message = await createTextMessage(chatId, auth.user.userId, parsed.data.content)

  if (!message) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  return NextResponse.json({ message })
}
