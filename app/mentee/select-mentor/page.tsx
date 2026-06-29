"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Mentor = {
  id: string
  name: string
  email: string
  department: string | null
}

export default function SelectMentorPage() {
  const router = useRouter()
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [selectedMentorId, setSelectedMentorId] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadMentors() {
      const token = localStorage.getItem("token")
      if (!token) {
        router.replace("/login?role=mentee")
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

      if (flowData.nextPath !== "/mentee/select-mentor") {
        router.replace(flowData.nextPath)
        return
      }

      const res = await fetch("/api/mentor/list", {
        headers: { authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus(data.error || "Unable to load mentors")
        return
      }

      setMentors(data.mentors)
    }

    loadMentors()
  }, [router])

  async function assignMentor() {
    const token = localStorage.getItem("token")
    if (!token) {
      router.replace("/login?role=mentee")
      return
    }

    if (!selectedMentorId) {
      setStatus("Please select a mentor")
      return
    }

    setLoading(true)
    setStatus("")

    try {
      const res = await fetch("/api/mentee/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ mentorId: selectedMentorId })
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus(data.error || "Unable to assign mentor")
        return
      }

      router.replace("/mentee/dashboard")
    } catch {
      setStatus("Unable to assign mentor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Select Mentor</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">First login: choose and confirm your mentor assignment.</p>

      <div className="grid gap-3">
        {mentors.map((mentor) => (
          <button
            key={mentor.id}
            onClick={() => setSelectedMentorId(mentor.id)}
            className={`rounded-lg border p-3 text-left ${
              selectedMentorId === mentor.id ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900" : ""
            }`}
          >
            <div className="font-semibold">{mentor.name}</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-300">{mentor.email}</div>
            <div className="text-sm">{mentor.department || "Department not set"}</div>
          </button>
        ))}
      </div>

      <button disabled={loading} onClick={assignMentor} className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-60">
        {loading ? "Assigning..." : "Confirm Assignment"}
      </button>
      {status && <p className="text-sm text-red-600">{status}</p>}
    </main>
  )
}
