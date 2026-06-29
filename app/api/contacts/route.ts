import { NextResponse } from "next/server"
import { authenticate } from "@/lib/authMiddleware"
import { ensureDemoData, getContacts } from "@/lib/chat"

export async function GET(req: Request) {
  await ensureDemoData()

  const auth = authenticate(req)

  if (auth.error) {
    return auth.error
  }

  const contacts = await getContacts(auth.user.userId)

  return NextResponse.json({ contacts })
}
