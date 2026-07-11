"use client"

import Image from "next/image"
import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { useRouter } from "next/navigation"

type AuthUser = {
  id: string
  name: string
  email: string
  about: string
  avatarSeed: string
}

type Contact = {
  id: string
  name: string
  email: string
  about: string
  avatarSeed: string
}

type ChatSummary = {
  id: string
  contact: Contact
  unreadCount: number
  lastMessage: {
    id: string
    content: string
    createdAt: string
    senderId: string
    seenAt: string | null
  } | null
}

type ChatMessage = {
  id: string
  content: string
  createdAt: string
  editedAt: string | null
  deletedAt: string | null
  seenAt: string | null
  senderId: string
  attachmentUrl: string | null
  attachmentType: string | null
  attachmentName: string | null
  attachmentSize: number | null
  sender: {
    id: string
    name: string
    avatarSeed: string
  }
}

type Conversation = {
  id: string
  contact: Contact
  messages: ChatMessage[]
}

type AttachmentPreview = {
  file: File
  previewUrl: string
}

function avatarTone(seed: string) {
  const palettes = [
    "from-emerald-400 to-teal-600",
    "from-cyan-400 to-sky-600",
    "from-orange-400 to-amber-600",
    "from-fuchsia-400 to-pink-600",
    "from-lime-400 to-emerald-600",
  ]
  const score = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return palettes[score % palettes.length]
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function formatAttachmentSize(size: number | null) {
  if (!size) {
    return ""
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function isImageAttachment(message: ChatMessage) {
  return Boolean(message.attachmentType?.startsWith("image/") && message.attachmentUrl)
}

function isPdfAttachment(message: ChatMessage) {
  return message.attachmentType === "application/pdf" && Boolean(message.attachmentUrl)
}

export default function ChatPage() {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [user, setUser] = useState<AuthUser | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [activeChatId, setActiveChatId] = useState("")
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [search, setSearch] = useState("")
  const [draft, setDraft] = useState("")
  const [status, setStatus] = useState("Loading your chats...")
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState("")
  const [editingDraft, setEditingDraft] = useState("")
  const [attachmentPreview, setAttachmentPreview] = useState<AttachmentPreview | null>(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [isPending, startTransition] = useTransition()
  const activeChatIdRef = useRef("")
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const deferredSearch = useDeferredValue(search)

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const query = deferredSearch.trim().toLowerCase()
      if (!query) return true

      return (
        chat.contact.name.toLowerCase().includes(query) ||
        chat.contact.email.toLowerCase().includes(query) ||
        chat.lastMessage?.content.toLowerCase().includes(query)
      )
    })
  }, [chats, deferredSearch])

  const suggestedContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const query = deferredSearch.trim().toLowerCase()
      if (!query) return true

      return (
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query)
      )
    })
  }, [contacts, deferredSearch])

  const handleUnauthorized = useCallback(() => {
    window.localStorage.removeItem("token")
    router.replace("/login")
  }, [router])

  const clearAttachmentPreview = useCallback(() => {
    setAttachmentPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl)
      }
      return null
    })
  }, [])

  const authorizedFetch = useCallback(async (input: string, init?: RequestInit) => {
    const currentToken = token || window.localStorage.getItem("token") || ""
    const headers = new Headers(init?.headers)

    headers.set("authorization", `Bearer ${currentToken}`)

    if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }

    return fetch(input, {
      ...init,
      headers,
    })
  }, [token])

  const loadConversation = useCallback(async (chatId: string) => {
    const response = await authorizedFetch(`/api/chats/${chatId}`)

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    const body = await response.json()

    if (!response.ok) {
      setError(body.error || "Unable to load conversation.")
      return
    }

    setConversation(body.conversation)
    setActiveChatId(chatId)
    activeChatIdRef.current = chatId
    setError("")
  }, [authorizedFetch, handleUnauthorized])

  const loadDashboard = useCallback(async (preferredChatId?: string) => {
    const [meResponse, contactsResponse, chatsResponse] = await Promise.all([
      authorizedFetch("/api/auth/me"),
      authorizedFetch("/api/contacts"),
      authorizedFetch("/api/chats"),
    ])

    if ([meResponse, contactsResponse, chatsResponse].some((response) => response.status === 401)) {
      handleUnauthorized()
      return
    }

    const [meBody, contactsBody, chatsBody] = await Promise.all([
      meResponse.json(),
      contactsResponse.json(),
      chatsResponse.json(),
    ])

    if (!meResponse.ok || !contactsResponse.ok || !chatsResponse.ok) {
      setError(meBody.error || contactsBody.error || chatsBody.error || "Unable to load your chat data.")
      return
    }

    setUser(meBody.user)
    setContacts(contactsBody.contacts)
    setChats(chatsBody.chats)
    setStatus("")

    const nextChatId = preferredChatId || activeChatIdRef.current || chatsBody.chats[0]?.id || ""
    if (nextChatId) {
      await loadConversation(nextChatId)
      return
    }

    setConversation(null)
    setActiveChatId("")
    activeChatIdRef.current = ""
  }, [authorizedFetch, handleUnauthorized, loadConversation])

  useEffect(() => {
    const storedToken = window.localStorage.getItem("token")

    if (!storedToken) {
      router.replace("/login")
      return
    }

    setToken(storedToken)
  }, [router])

  useEffect(() => {
    if (!token) return

    startTransition(() => {
      void loadDashboard()
    })
  }, [token, loadDashboard])

  useEffect(() => {
    if (!token) return

    const protocol = window.location.protocol === "https:" ? "wss" : "ws"
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws?token=${encodeURIComponent(token)}`)

    socket.onopen = () => {
      setSocketConnected(true)
    }

    socket.onmessage = () => {
      startTransition(() => {
        void loadDashboard(activeChatIdRef.current || undefined)
      })
    }

    socket.onclose = () => {
      setSocketConnected(false)
    }

    socket.onerror = () => {
      setSocketConnected(false)
    }

    return () => {
      socket.close()
    }
  }, [token, loadDashboard])

  useEffect(() => {
    if (!token) return

    const interval = window.setInterval(() => {
      startTransition(() => {
        void loadDashboard(activeChatIdRef.current || undefined)
      })
    }, 15000)

    return () => window.clearInterval(interval)
  }, [token, loadDashboard])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [conversation?.messages.length, activeChatId])

  useEffect(() => {
    return () => {
      if (attachmentPreview) {
        URL.revokeObjectURL(attachmentPreview.previewUrl)
      }
    }
  }, [attachmentPreview])

  async function startDirectChat(contactId: string) {
    const response = await authorizedFetch("/api/chats/direct", {
      method: "POST",
      body: JSON.stringify({ contactId })
    })

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    const body = await response.json()

    if (!response.ok) {
      setError(body.error || "Unable to start chat.")
      return
    }

    await loadDashboard(body.conversationId)
  }

  async function submitComposer() {
    if (!activeChatId) return

    setSending(true)
    setError("")

    try {
      if (attachmentPreview) {
        const formData = new FormData()
        formData.append("file", attachmentPreview.file)
        formData.append("content", draft.trim())

        const response = await authorizedFetch(`/api/chats/${activeChatId}/uploads`, {
          method: "POST",
          body: formData
        })

        const body = await response.json()

        if (response.status === 401) {
          handleUnauthorized()
          return
        }

        if (!response.ok) {
          setError(body.error || "Unable to upload attachment.")
          return
        }

        setDraft("")
        clearAttachmentPreview()
        await loadDashboard(activeChatId)
        return
      }

      const content = draft.trim()
      if (!content) return

      const response = await authorizedFetch(`/api/chats/${activeChatId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content })
      })

      const body = await response.json()

      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        setError(body.error || "Unable to send message.")
        return
      }

      setDraft("")
      await loadDashboard(activeChatId)
    } finally {
      setSending(false)
    }
  }

  async function submitEditedMessage(messageId: string) {
    if (!editingDraft.trim()) return

    const response = await authorizedFetch(`/api/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ content: editingDraft.trim() })
    })

    const body = await response.json()

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    if (!response.ok) {
      setError(body.error || "Unable to update message.")
      return
    }

    setEditingMessageId("")
    setEditingDraft("")
    await loadDashboard(activeChatIdRef.current || undefined)
  }

  async function deleteMessage(messageId: string) {
    const response = await authorizedFetch(`/api/messages/${messageId}`, {
      method: "DELETE"
    })

    const body = await response.json()

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    if (!response.ok) {
      setError(body.error || "Unable to delete message.")
      return
    }

    await loadDashboard(activeChatIdRef.current || undefined)
  }

  function onComposerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitComposer()
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()

      if ((draft.trim() || attachmentPreview) && !sending) {
        void submitComposer()
      }
    }
  }

  function onAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    clearAttachmentPreview()
    setAttachmentPreview({
      file,
      previewUrl: URL.createObjectURL(file)
    })
    event.target.value = ""
  }

  function logout() {
    window.localStorage.removeItem("token")
    router.replace("/login")
  }

  return (
    <main className="min-h-screen bg-[#0b141a] text-white md:p-5">
      <section className="mx-auto grid min-h-screen max-w-[1600px] overflow-hidden bg-[#111b21] shadow-2xl shadow-black/40 md:min-h-[calc(100vh-2.5rem)] md:grid-cols-[390px_1fr] md:rounded-[2rem]">
        <aside className="flex min-h-screen flex-col border-r border-white/6 bg-[#111b21] md:min-h-0">
          <div className="flex items-center justify-between bg-[#202c33] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${avatarTone(user?.avatarSeed || "me")} text-sm font-bold text-white`}>
                {initials(user?.name || "Me")}
              </div>
              <div>
                <p className="font-semibold">{user?.name || "Loading..."}</p>
                <p className="text-xs text-[#8fa3ad]">{user?.about || "Fetching your status"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`hidden rounded-full px-3 py-1.5 text-[11px] font-semibold md:block ${socketConnected ? "bg-emerald-500/15 text-emerald-300" : "bg-white/6 text-[#8fa3ad]"}`}>
                {socketConnected ? "realtime on" : "polling fallback"}
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-[#d1dbe1] transition hover:bg-white/8"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="border-b border-white/6 px-4 py-3">
            <input
              className="w-full rounded-2xl bg-[#202c33] px-4 py-3 text-sm text-white outline-none placeholder:text-[#7d9099]"
              placeholder="Search or start a new chat"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="border-b border-white/6 px-4 py-3">
            <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[#6f8792]">
              <span>Favorites</span>
              <span>{contacts.length} contacts</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {suggestedContacts.slice(0, 8).map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => void startDirectChat(contact.id)}
                  className="min-w-[115px] rounded-2xl bg-[#172229] px-3 py-3 text-left transition hover:bg-[#203038]"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${avatarTone(contact.avatarSeed)} text-xs font-bold text-white`}>
                    {initials(contact.name)}
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold">{contact.name}</p>
                  <p className="truncate text-xs text-[#7d9099]">Tap to chat</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      void loadConversation(chat.id)
                    })
                  }}
                  className={`flex w-full items-start gap-3 border-b border-white/6 px-4 py-4 text-left transition hover:bg-white/4 ${activeChatId === chat.id ? "bg-[#2a3942]" : ""}`}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarTone(chat.contact.avatarSeed)} text-sm font-bold text-white`}>
                    {initials(chat.contact.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate font-semibold text-[#e7f0f4]">{chat.contact.name}</p>
                      {chat.lastMessage && (
                        <span className="shrink-0 text-xs text-[#7d9099]">
                          {formatTime(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="truncate text-sm text-[#8fa3ad]">
                        {chat.lastMessage?.content || "Start your first message"}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#25d366] px-1.5 text-[11px] font-bold text-[#081c15]">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-[#8fa3ad]">
                No chats match your search yet. Start one from the contacts row above.
              </div>
            )}
          </div>
        </aside>

        <section className="relative flex min-h-screen flex-col bg-[#0b141a] md:min-h-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,211,102,0.08),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(32,44,51,0.4),transparent_30%),linear-gradient(0deg,rgba(14,27,35,0.96),rgba(14,27,35,0.96)),linear-gradient(45deg,rgba(255,255,255,0.02)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.02)_50%,rgba(255,255,255,0.02)_75%,transparent_75%,transparent)] bg-[length:auto,auto,auto,28px_28px]" />

          {conversation ? (
            <>
              <header className="relative z-10 flex items-center justify-between border-b border-white/6 bg-[#202c33] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${avatarTone(conversation.contact.avatarSeed)} text-sm font-bold text-white`}>
                    {initials(conversation.contact.name)}
                  </div>
                  <div>
                    <p className="font-semibold">{conversation.contact.name}</p>
                    <p className="text-xs text-[#8fa3ad]">{socketConnected ? "connected live" : "syncing with fallback polling"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8fa3ad]">
                  <span className="hidden rounded-full bg-white/6 px-3 py-1.5 md:inline-flex">media</span>
                  <span className="hidden rounded-full bg-white/6 px-3 py-1.5 md:inline-flex">edit</span>
                  <span className="hidden rounded-full bg-white/6 px-3 py-1.5 md:inline-flex">delete</span>
                  <span>{isPending ? "Refreshing..." : socketConnected ? "Live" : "Fallback mode"}</span>
                </div>
              </header>

              <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 md:px-8">
                <div className="mx-auto flex max-w-4xl flex-col gap-2">
                  <div className="mb-3 self-center rounded-full bg-[#1f2c34]/90 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[#9eb2bc] shadow">
                    recruiter-upgrade build
                  </div>

                  {conversation.messages.map((message) => {
                    const isMine = message.senderId === user?.id
                    const isEditing = editingMessageId === message.id

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[88%] rounded-[1.35rem] px-4 py-3 shadow-md md:max-w-[70%] ${isMine ? "rounded-br-sm bg-[#144d37] text-[#effff5]" : "rounded-bl-sm bg-[#202c33] text-[#e0edf3]"}`}
                        >
                          {message.deletedAt ? (
                            <p className="text-[15px] italic text-[#b7c9d2]">This message was deleted</p>
                          ) : isEditing ? (
                            <div className="space-y-3">
                              <textarea
                                rows={3}
                                value={editingDraft}
                                onChange={(event) => setEditingDraft(event.target.value)}
                                className="w-full rounded-2xl bg-black/15 px-3 py-2 text-sm text-white outline-none"
                              />
                              <div className="flex justify-end gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMessageId("")
                                    setEditingDraft("")
                                  }}
                                  className="rounded-full bg-white/10 px-3 py-1.5"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void submitEditedMessage(message.id)}
                                  className="rounded-full bg-[#25d366] px-3 py-1.5 font-semibold text-[#062915]"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {isImageAttachment(message) && (
                                <a href={message.attachmentUrl || "#"} target="_blank" rel="noreferrer">
                                  <Image
                                    src={message.attachmentUrl || ""}
                                    alt={message.attachmentName || "attachment"}
                                    width={1200}
                                    height={800}
                                    unoptimized
                                    className="mb-3 max-h-72 w-full rounded-2xl object-cover"
                                  />
                                </a>
                              )}

                              {isPdfAttachment(message) && (
                                <a
                                  href={message.attachmentUrl || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mb-3 block rounded-2xl bg-black/15 px-4 py-3 text-sm font-medium text-[#d8f3e1]"
                                >
                                  Open PDF: {message.attachmentName}
                                  <span className="ml-2 text-xs opacity-75">{formatAttachmentSize(message.attachmentSize)}</span>
                                </a>
                              )}

                              {!isImageAttachment(message) && message.attachmentUrl && !isPdfAttachment(message) && (
                                <a
                                  href={message.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mb-3 block rounded-2xl bg-black/15 px-4 py-3 text-sm font-medium text-[#d8f3e1]"
                                >
                                  Download: {message.attachmentName}
                                  <span className="ml-2 text-xs opacity-75">{formatAttachmentSize(message.attachmentSize)}</span>
                                </a>
                              )}

                              {message.content && <p className="text-[15px] leading-6">{message.content}</p>}

                              {isMine && !message.deletedAt && (
                                <div className="mt-3 flex justify-end gap-2 text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMessageId(message.id)
                                      setEditingDraft(message.content)
                                    }}
                                    className="rounded-full bg-white/8 px-2.5 py-1"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void deleteMessage(message.id)}
                                    className="rounded-full bg-white/8 px-2.5 py-1"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </>
                          )}

                          <div className={`mt-2 flex items-center gap-2 text-[11px] ${isMine ? "justify-end text-[#b5d6c8]" : "justify-end text-[#8fa3ad]"}`}>
                            <span>{formatTime(message.createdAt)}</span>
                            {message.editedAt && !message.deletedAt && <span>edited</span>}
                            {isMine && !message.deletedAt && <span>{message.seenAt ? "Seen" : "Sent"}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form onSubmit={onComposerSubmit} className="relative z-10 border-t border-white/6 bg-[#202c33] px-4 py-4 md:px-6">
                <div className="mx-auto max-w-4xl">
                  {attachmentPreview && (
                    <div className="mb-3 rounded-[1.5rem] bg-[#2a3942] p-3">
                      <div className="mb-2 flex items-center justify-between text-xs text-[#b2c2ca]">
                        <span>{attachmentPreview.file.name}</span>
                        <button
                          type="button"
                          onClick={clearAttachmentPreview}
                          className="rounded-full bg-white/8 px-2.5 py-1"
                        >
                          Remove
                        </button>
                      </div>
                      {attachmentPreview.file.type.startsWith("image/") ? (
                        <Image
                          src={attachmentPreview.previewUrl}
                          alt={attachmentPreview.file.name}
                          width={1200}
                          height={800}
                          unoptimized
                          className="max-h-48 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="rounded-2xl bg-black/15 px-4 py-3 text-sm text-[#d7e4ea]">
                          Ready to upload {attachmentPreview.file.name}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-end gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="hidden h-[52px] items-center rounded-full bg-[#2a3942] px-4 text-sm text-[#93a7b2] md:flex"
                    >
                      attach
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                      onChange={onAttachmentChange}
                      className="hidden"
                    />
                    <textarea
                      rows={1}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={onComposerKeyDown}
                      placeholder={attachmentPreview ? "Add a caption (optional)" : "Type a message"}
                      className="max-h-40 min-h-[52px] flex-1 resize-y rounded-[1.5rem] bg-[#2a3942] px-5 py-3 text-sm text-white outline-none placeholder:text-[#93a7b2]"
                    />
                    <button
                      type="submit"
                      disabled={sending || (!draft.trim() && !attachmentPreview)}
                      className="rounded-full bg-[#25d366] px-5 py-3 text-sm font-semibold text-[#062915] transition hover:bg-[#45e07c] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending ? "Sending..." : attachmentPreview ? "Upload" : "Send"}
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="relative z-10 flex flex-1 items-center justify-center px-6">
              <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/8 bg-[#111b21]/85 p-8 text-center shadow-xl backdrop-blur">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#1daa61] text-3xl font-black text-white">
                  W
                </div>
                <h1 className="mt-6 text-3xl font-black tracking-tight">Choose a contact to begin chatting.</h1>
                <p className="mt-4 text-sm leading-7 text-[#8fa3ad]">
                  Realtime updates, attachments, and message actions are ready once you enter a conversation.
                </p>

                <div className="mt-8 grid gap-3 md:grid-cols-2">
                  {suggestedContacts.slice(0, 4).map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => void startDirectChat(contact.id)}
                      className="rounded-2xl border border-white/8 bg-[#172229] p-4 text-left transition hover:bg-[#203038]"
                    >
                      <p className="font-semibold">{contact.name}</p>
                      <p className="mt-1 text-sm text-[#8fa3ad]">{contact.about}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(status || error) && (
            <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-[#172229]/95 px-4 py-2 text-xs text-[#d7e4ea] shadow-lg backdrop-blur">
              {error || status}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
