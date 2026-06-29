export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center p-6 md:p-10">
      <section className="grid w-full gap-6 overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-2xl shadow-cyan-950/10 backdrop-blur md:grid-cols-[1.15fr_0.85fr] md:p-10">
        <div className="flex flex-col justify-between">
          <div>
            <p className="inline-flex rounded-full bg-[#0f2f2f] px-4 py-1 text-xs font-semibold tracking-[0.2em] text-[#d4fff7]">
              WHATSAPP-STYLE CHAT EXPERIENCE
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-[#102a2b] md:text-6xl">
              Build and run a real chat app that feels instantly familiar.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 md:text-lg">
              WaveChat gives you the core WhatsApp-like experience locally: sign up, switch between contacts, send messages, and watch conversations refresh in near real time.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/login"
              className="rounded-2xl bg-[#1daa61] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30"
            >
              Open the app
            </a>
            <a
              href="/chat"
              className="rounded-2xl border border-[#0f2f2f]/15 px-6 py-3 text-sm font-semibold text-[#102a2b] transition hover:bg-[#f2f8f7]"
            >
              Jump to chat
            </a>
          </div>

          <div className="mt-8 grid gap-3 text-sm text-zinc-600 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4">
              <p className="font-semibold text-[#102a2b]">Direct messaging</p>
              <p className="mt-2">Open a thread and send messages instantly.</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4">
              <p className="font-semibold text-[#102a2b]">Demo accounts</p>
              <p className="mt-2">Preloaded users make testing easy from minute one.</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4">
              <p className="font-semibold text-[#102a2b]">Local database</p>
              <p className="mt-2">SQLite keeps everything self-contained on your machine.</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.75rem] bg-[#0b141a] p-5 text-white shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
          <div className="relative rounded-[1.5rem] border border-white/10 bg-[#111b21] p-4">
            <div className="flex items-center justify-between rounded-2xl bg-[#202c33] px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Riya Sharma</p>
                <p className="text-xs text-[#91a6b1]">online now</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#25d366]" />
            </div>

            <div className="mt-4 space-y-3 rounded-[1.25rem] bg-[#0f1c23] p-4">
              <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-[#202c33] px-4 py-3 text-sm text-[#d8e4ea]">
                Can we make it feel like WhatsApp?
              </div>
              <div className="ml-auto max-w-[75%] rounded-2xl rounded-tr-sm bg-[#144d37] px-4 py-3 text-sm text-[#ecfff6]">
                Yes. Same familiar layout, but built as your own working app.
              </div>
              <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-[#202c33] px-4 py-3 text-sm text-[#d8e4ea]">
                Perfect. I want contacts, live threads, and clean message bubbles.
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-[#202c33] px-4 py-3 text-sm text-[#91a6b1]">
              Type a message...
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
