"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type MentorDashboardData = {
  message: string
  user: {
    name: string
    email: string
    department: string | null
    mentorLinks: Array<{
      mentee: {
        id: string
        name: string
        email: string
      }
    }>
  } | null
}

export default function MentorDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<MentorDashboardData | null>(null)
  const [status, setStatus] = useState("")

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token")
      if (!token) {
        router.replace("/login?role=mentor")
        return
      }

      const flowRes = await fetch("/api/auth/flow", {
        headers: { authorization: `Bearer ${token}` }
      })
      const flowData = await flowRes.json()

      if (!flowRes.ok) {
        router.replace("/login")
        return
      }

      if (flowData.nextPath !== "/mentor/dashboard") {
        router.replace(flowData.nextPath)
        return
      }

      const res = await fetch("/api/mentor", {
        headers: { authorization: `Bearer ${token}` }
      })
      const body = await res.json()

      if (!res.ok) {
        setStatus(body.error || "Unable to load mentor dashboard")
        return
      }

      setData(body)
    }

    load()
  }, [router])

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-3 p-6">
      <h1 className="text-2xl font-bold">Mentor Dashboard</h1>
      {status && <p className="text-sm text-red-600">{status}</p>}
      {data?.user && (
        <div className="rounded-lg border p-4">
          <p><strong>Name:</strong> {data.user.name}</p>
          <p><strong>Email:</strong> {data.user.email}</p>
          <p><strong>Department:</strong> {data.user.department || "Not set"}</p>
          <p><strong>Mentees:</strong> {data.user.mentorLinks.length}</p>
        </div>
      )}
    </main>
  )
}
