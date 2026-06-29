"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function MentorSetupPage() {
  const router = useRouter()
  const [department, setDepartment] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function guardMentorSetup() {
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

      if (flowData.nextPath !== "/mentor/setup") {
        router.replace(flowData.nextPath)
      }
    }

    guardMentorSetup()
  }, [router])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()

    const token = localStorage.getItem("token")
    if (!token) {
      router.replace("/login?role=mentor")
      return
    }

    setLoading(true)
    setStatus("")

    try {
      const res = await fetch("/api/mentor/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ department })
      })

      const data = await res.json()
      if (!res.ok) {
        setStatus(data.error || "Unable to complete setup")
        return
      }

      router.replace("/mentor/dashboard")
    } catch {
      setStatus("Unable to complete setup")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border p-4">
        <h1 className="text-xl font-bold">Mentor Profile Setup</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">First login: add your department to continue.</p>
        <input
          className="rounded border p-2"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Department"
          required
        />
        <button disabled={loading} className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-60">
          {loading ? "Saving..." : "Save and Continue"}
        </button>
        {status && <p className="text-sm text-red-600">{status}</p>}
      </form>
    </main>
  )
}
