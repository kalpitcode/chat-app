"use client"

import { useEffect, useState } from "react"
import { getSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState("Finalizing login...")

  useEffect(() => {
    async function finalizeOAuthLogin() {
      try {
        const session = await getSession()

        const email = session?.user?.email
        const name = session?.user?.name || undefined

        if (!email) {
          setMessage("No Google session found. Please login again.")
          return
        }

        const params = new URLSearchParams(window.location.search)
        const roleParam = params.get("role")
        const role = roleParam === "mentor" || roleParam === "mentee" ? roleParam : undefined

        const loginRes = await fetch("/api/auth/oauth-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, role })
        })

        const loginData = await loginRes.json()

        if (!loginRes.ok || !loginData.token) {
          setMessage(loginData.error || "Unable to complete OAuth login.")
          return
        }

        localStorage.setItem("token", loginData.token)

        const flowRes = await fetch("/api/auth/flow", {
          headers: { authorization: `Bearer ${loginData.token}` }
        })

        const flowData = await flowRes.json()

        if (!flowRes.ok || !flowData.nextPath) {
          setMessage(flowData.error || "Unable to route workflow.")
          return
        }

        router.replace(flowData.nextPath)
      } catch {
        setMessage("Unable to continue after login.")
      }
    }

    finalizeOAuthLogin()
  }, [router])

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6">
      <div className="w-full rounded-2xl border border-zinc-200 bg-white/80 p-8 text-center shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <h1 className="text-xl font-semibold">Signing you in</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
      </div>
    </main>
  )
}
