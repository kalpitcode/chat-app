import { NextResponse } from "next/server"
import { authenticate } from "@/lib/authMiddleware"
import { ensureDemoData, getChatSummaries } from "@/lib/chat"

export async function GET(req: Request) {
  await ensureDemoData()

  const auth = authenticate(req)

  if (auth.error) {
    return auth.error
  }

  const chats = await getChatSummaries(auth.user.userId)

  return NextResponse.json({ chats })
}
