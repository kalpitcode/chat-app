import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authenticate } from "@/lib/authMiddleware"
import { menteeAssignSchema } from "@/lib/validators"

export async function POST(req: Request) {
  const auth = authenticate(req)

  if (auth.error) {
    return auth.error
  }

  if (auth.user.role !== "mentee") {
    return NextResponse.json({ error: "Mentee access only" }, { status: 403 })
  }

  const body = await req.json()
  const { mentorId } = menteeAssignSchema.parse(body)

  const mentor = await prisma.user.findUnique({
    where: { id: mentorId },
    select: { id: true, role: true }
  })

  if (!mentor || mentor.role !== "mentor") {
    return NextResponse.json({ error: "Invalid mentor" }, { status: 400 })
  }

  const assignment = await prisma.mentorship.upsert({
    where: { menteeId: auth.user.userId },
    create: {
      mentorId,
      menteeId: auth.user.userId
    },
    update: {
      mentorId
    },
    include: {
      mentor: {
        select: { id: true, name: true, email: true, department: true }
      }
    }
  })

  return NextResponse.json({
    message: "Mentor assigned successfully",
    assignment
  })
}
