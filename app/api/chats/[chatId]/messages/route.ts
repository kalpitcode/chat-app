import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authenticate } from "@/lib/authMiddleware"
import { messageSchema } from "@/lib/validators"
import { ensureDemoData, getConversationForUser } from "@/lib/chat"

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
  const { content } = messageSchema.parse(body)

  const conversation = await getConversationForUser(chatId, auth.user.userId)

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: chatId,
        senderId: auth.user.userId,
        content
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarSeed: true
          }
        }
      }
    }),
    prisma.conversation.update({
      where: { id: chatId },
      data: {
        updatedAt: new Date()
      }
    })
  ])

  return NextResponse.json({ message })
}
