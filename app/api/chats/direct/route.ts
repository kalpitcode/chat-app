import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authenticate } from "@/lib/authMiddleware"
import { directChatSchema } from "@/lib/validators"
import { ensureDemoData, getOrCreateDirectConversation } from "@/lib/chat"

export async function POST(req: Request) {
  await ensureDemoData()

  const auth = authenticate(req)

  if (auth.error) {
    return auth.error
  }

  const body = await req.json()
  const { contactId } = directChatSchema.parse(body)

  if (contactId === auth.user.userId) {
    return NextResponse.json({ error: "Choose another contact" }, { status: 400 })
  }

  const contact = await prisma.user.findUnique({
    where: { id: contactId },
    select: { id: true }
  })

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 })
  }

  const conversation = await getOrCreateDirectConversation(auth.user.userId, contactId)

  return NextResponse.json({ conversationId: conversation.id })
}
