import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateToken } from "@/lib/jwt"
import { z } from "zod"

const oauthLoginSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["mentor", "mentee"]).optional()
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, name, role } = oauthLoginSchema.parse(body)

    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: name?.trim() || "OAuth User",
          email,
          role: role || "mentee"
        }
      })
    } else if (role && user.role !== role) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role }
      })
    }

    const token = generateToken(user.id, user.role)

    return NextResponse.json({
      message: "OAuth login successful",
      token
    })
  } catch {
    return NextResponse.json({ error: "OAuth login failed" }, { status: 500 })
  }
}
