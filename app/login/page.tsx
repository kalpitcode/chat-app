"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

const demoAccounts = [
  { name: "Riya Sharma", email: "riya@chat.local", password: "Demo1234" },
  { name: "Kabir Mehta", email: "kabir@chat.local", password: "Demo1234" },
  { name: "Aanya Singh", email: "aanya@chat.local", password: "Demo1234" },
  { name: "Zoya Khan", email: "zoya@chat.local", password: "Demo1234" }
]

export default function LoginPage() {
  const router = useRouter()
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setStatus("")

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(isSignup ? { name, email, password } : { email, password })
      })

      const body = await response.json()

      if (!response.ok || !body.token) {
        setStatus(body.error || "Unable to continue.")
        return
      }

      localStorage.setItem("token", body.token)
      router.push("/chat")
    } catch {
      setStatus("Something went wrong while connecting to the chat service.")
    } finally {
      setLoading(false)
    }
  }

  function fillDemoAccount(emailValue: string, passwordValue: string) {
    setEmail(emailValue)
    setPassword(passwordValue)
    setIsSignup(false)
    setStatus("Demo credentials loaded. Press login to enter the app.")
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center p-6 md:p-10">
      <section className="grid w-full overflow-hidden rounded-[2rem] border border-white/60 bg-white/85 shadow-2xl shadow-cyan-950/10 backdrop-blur md:grid-cols-[0.95fr_1.05fr]">
        <aside className="relative overflow-hidden bg-[#0f2f2f] p-8 text-white md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(37,211,102,0.22),transparent_35%)]" />
          <div className="relative">
            <p className="inline-flex rounded-full border border-white/20 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-[#d9fff1]">
              WAVECHAT ACCESS
            </p>
            <h1 className="mt-6 text-4xl font-black tracking-tight">Login to your conversations.</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#c4dbd7] md:text-base">
              This project now behaves like a real WhatsApp-style messenger. Use a demo account or create your own and start chatting immediately.
            </p>

            <div className="mt-8 grid gap-3">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemoAccount(account.email, account.password)}
                  className="rounded-2xl border border-white/12 bg-white/8 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/12"
                >
                  <p className="font-semibold">{account.name}</p>
                  <p className="mt-1 text-sm text-[#c4dbd7]">{account.email}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#8be7c0]">Password: Demo1234</p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="p-8 md:p-10">
          <div className="inline-flex rounded-2xl bg-[#edf4f3] p-1">
            <button
              type="button"
              onClick={() => setIsSignup(false)}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${!isSignup ? "bg-white text-[#102a2b] shadow-sm" : "text-zinc-500"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsSignup(true)}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${isSignup ? "bg-white text-[#102a2b] shadow-sm" : "text-zinc-500"}`}
            >
              Sign up
            </button>
          </div>

          <div className="mt-8">
            <h2 className="text-3xl font-black tracking-tight text-[#102a2b]">
              {isSignup ? "Create your chat account" : "Welcome back"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              {isSignup
                ? "New accounts drop straight into the messenger. No separate onboarding flow needed."
                : "Your sidebar, contacts, and recent messages will load as soon as you sign in."}
            </p>
          </div>

          <form onSubmit={authenticate} className="mt-8 space-y-4">
            {isSignup && (
              <input
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2"
                placeholder="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            )}
            <input
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <input
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {isSignup && (
              <p className="text-xs text-zinc-500">
                Use at least 8 characters with uppercase, lowercase, and a number.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#1daa61] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#179c58] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Connecting..." : isSignup ? "Create account" : "Enter chat"}
            </button>
          </form>

          {status && (
            <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {status}
            </p>
          )}

          <div className="mt-8 rounded-[1.5rem] border border-zinc-200 bg-[#f7fbfa] p-5">
            <p className="text-sm font-semibold text-[#102a2b]">What you get right now</p>
            <div className="mt-4 grid gap-3 text-sm text-zinc-600 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-4">Working authentication with JWT.</div>
              <div className="rounded-2xl bg-white p-4">WhatsApp-style sidebar and thread layout.</div>
              <div className="rounded-2xl bg-white p-4">Local SQLite data with seeded sample chats.</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
