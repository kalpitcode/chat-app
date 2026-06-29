import { NextResponse } from "next/server"
import { authenticate } from "@/lib/authMiddleware"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {

  const auth = authenticate(req)

  if (auth.error) {
    return auth.error
  }

  if (auth.user.role !== "mentor") {
    return NextResponse.json(
      { error: "Mentor access only" },
      { status: 403 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      mentorLinks: {
        select: {
          mentee: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  })

  return NextResponse.json({
    message: "Mentor dashboard access",
    user
  })

}
