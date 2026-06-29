import { NextResponse } from "next/server"
import { verifyToken } from "./jwt"

type Role = "mentor" | "mentee"

type AuthUser = {
  userId: string
  role: Role
}

export function authenticate(req: Request) {

  const authHeader = req.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      )
    }
  }

  const token = authHeader.split(" ")[1]

  const decoded = verifyToken(token)

  if (!decoded || typeof decoded === "string") {
    return {
      error: NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }
  }

  const { userId, role } = decoded as Partial<AuthUser>

  if (!userId || (role !== "mentor" && role !== "mentee")) {
    return {
      error: NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }
  }

  return { user: { userId, role } as AuthUser }
}
