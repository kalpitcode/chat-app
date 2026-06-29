import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authenticate } from "@/lib/authMiddleware"
import { ensureDemoData } from "@/lib/chat"

export async function GET(req: Request) {
  await ensureDemoData()

  const auth = authenticate(req)

  if (auth.error) {
    return auth.error
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.userId },
    select: {
      id: true,
      name: true,
      email: true,
      about: true,
      avatarSeed: true
    }
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({ user })
}
