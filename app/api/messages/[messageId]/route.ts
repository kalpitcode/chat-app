import { NextResponse } from "next/server"
import { authenticate } from "@/lib/authMiddleware"
import { deleteOwnMessage, ensureDemoData, updateOwnMessage } from "@/lib/chat"
import { enforceRateLimit } from "@/lib/rate-limit"
import { messageUpdateSchema } from "@/lib/validators"

type RouteContext = {
  params: Promise<{
    messageId: string
  }>
}

export async function PATCH(req: Request, context: RouteContext) {
  await ensureDemoData()

  const auth = authenticate(req)

  if (auth.error) {
    return auth.error
  }

  try {
    enforceRateLimit(`edit:${auth.user.userId}`, 20, 60_000)
  } catch {
    return NextResponse.json({ error: "Too many edit requests" }, { status: 429 })
  }

  const parsed = messageUpdateSchema.safeParse(await req.json())

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 })
  }

  const { messageId } = await context.params

  try {
    const message = await updateOwnMessage(messageId, auth.user.userId, parsed.data.content)

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    return NextResponse.json({ message })
  } catch (error) {
    const status = (error as Error & { status?: number }).status || 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update message" },
      { status }
    )
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  await ensureDemoData()

  const auth = authenticate(req)

  if (auth.error) {
    return auth.error
  }

  try {
    enforceRateLimit(`delete:${auth.user.userId}`, 20, 60_000)
  } catch {
    return NextResponse.json({ error: "Too many delete requests" }, { status: 429 })
  }

  const { messageId } = await context.params
  const message = await deleteOwnMessage(messageId, auth.user.userId)

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 })
  }

  return NextResponse.json({ message })
}
