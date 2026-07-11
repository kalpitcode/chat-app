import prisma from "@/lib/prisma"
import { authenticate } from "@/lib/authMiddleware"
import { NextResponse } from "next/server"

export async function GET(req: Request) {

  const auth = authenticate(req)

  if ("error" in auth) {
    return auth.error
  }

  const { userId } = auth.user

  const mentor = await prisma.user.findUnique({
    where: { id: userId }
  })

  const mentees = await prisma.mentorship.findMany({
    where: {
      mentorId: userId
    },
    include: {
      mentee: true
    }
  })

  return NextResponse.json({
    mentor,
    mentees
  })
}