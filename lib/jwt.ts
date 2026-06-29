import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "supersecretkey"

export function generateToken(userId: string, role: string) {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: "1h" }
  )
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}
