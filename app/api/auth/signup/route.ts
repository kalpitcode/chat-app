import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import prisma from "@/lib/prisma"
import { ensureDemoData } from "@/lib/chat"
import { generateToken } from "@/lib/jwt"
import { signupSchema } from "@/lib/validators"

export async function POST(req: Request) {
  try {
    await ensureDemoData()

    const body = await req.json()

    const { name, email, password, role } = signupSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role,
        avatarSeed: name.toLowerCase().replace(/\s+/g, "-")
      }
    })

    const token = generateToken(user.id, user.role)

    return NextResponse.json({
      message: "Account created successfully",
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
      { error: "Signup failed" },
      { status: 500 }
    )

  }
}
