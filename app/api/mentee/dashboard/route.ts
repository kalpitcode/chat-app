import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function GET(req: Request) {

  try {

    const authHeader = req.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Token missing" })
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!)

    console.log("Decoded token:", decoded)

    const mentee = await prisma.user.findUnique({
     where: { id: decoded.userId },
      include: {
        menteeLink: {
          include: {
            mentor: true
          }
        }
      }
    })
if (!mentee) {
  return NextResponse.json({ error: "Mentee not found" })
}
    console.log("Mentee found:", mentee)

    return NextResponse.json({
      mentee,
      mentor: mentee?.menteeLink?.mentor
    })

  } catch (error) {

    console.error("API ERROR:", error)

    return NextResponse.json({
      error: "Server crash",
      details: String(error)
    })

  }

}