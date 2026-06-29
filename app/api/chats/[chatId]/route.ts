import { NextResponse } from "next/server"
import { authenticate } from "@/lib/authMiddleware"
import { ensureDemoData, getConversationForUser } from "@/lib/chat"

type RouteContext = {
  params: Promise<{
    chatId: string
  }>
}

export async function GET(req: Request, context: RouteContext) {
  await ensureDemoData()

  const auth = authenticate(req)

  if (auth.error) {
    return auth.error
  }

  const { chatId } = await context.params

  const conversation = await getConversationForUser(chatId, auth.user.userId)

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  const contact =
    conversation.firstUserId === auth.user.userId ? conversation.secondUser : conversation.firstUser

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      contact,
      messages: conversation.messages
    }
  })
}
