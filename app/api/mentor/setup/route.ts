import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authenticate } from "@/lib/authMiddleware"
import { mentorSetupSchema } from "@/lib/validators"

export async function POST(req: Request) {
  const auth = authenticate(req)

  if (auth.error) {
    return auth.error
  }

  if (auth.user.role !== "mentor") {
    return NextResponse.json({ error: "Mentor access only" }, { status: 403 })
  }

  const body = await req.json()
  const { department } = mentorSetupSchema.parse(body)

  const user = await prisma.user.update({
    where: { id: auth.user.userId },
    data: { department },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true
    }
  })

  return NextResponse.json({
    message: "Profile setup complete",
    user
  })
}
