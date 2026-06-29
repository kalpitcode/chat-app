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

  const user = await prisma.user.findUnique({
    where: { id: auth.user.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      menteeLink: {
        select: {
          mentor: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true
            }
          }
        }
      }
    }
  })

  return NextResponse.json({
    message: "Mentee dashboard access",
    user
  })
}
