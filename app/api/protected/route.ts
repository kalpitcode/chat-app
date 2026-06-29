import { NextResponse } from "next/server"
import { authenticate } from "@/lib/authMiddleware"

export async function GET(req: Request) {
  const auth = authenticate(req)

  if (auth.error) {
    return auth.error
  }

  return NextResponse.json({
    message: "Access granted",
    user: auth.user
  })
}
