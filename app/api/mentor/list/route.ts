import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authenticate } from "@/lib/authMiddleware"

export async function GET(req: Request) {
  const auth = authenticate(req)

  if (auth.error) {
    return auth.error
  }

  if (auth.user.role !== "mentee") {
    return NextResponse.json({ error: "Mentee access only" }, { status: 403 })
  }

  const mentors = await prisma.user.findMany({
    where: { role: "mentor" },
    select: {
      id: true,
      name: true,
      email: true,
      department: true
    },
    orderBy: { createdAt: "asc" }
  })

  return NextResponse.json({ mentors })
}
