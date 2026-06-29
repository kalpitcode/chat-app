import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import prisma from "@/lib/prisma"
import { ensureDemoData } from "@/lib/chat"
import { loginSchema } from "@/lib/validators"
import { generateToken } from "@/lib/jwt"

export async function POST(req: Request) {
  try {
    await ensureDemoData()

    const body = await req.json()

    const { email, password } = loginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const valid = await bcrypt.compare(
      password,
      user.passwordHash || ""
    )

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const token = generateToken(user.id, user.role)

    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        about: user.about,
        avatarSeed: user.avatarSeed
      }
    })

  } catch {

    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    )

  }
}
