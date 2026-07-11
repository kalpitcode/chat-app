type RealtimeEventType =
  | "message:created"
  | "message:updated"
  | "message:deleted"
  | "message:seen"

export type RealtimePayload = {
  type: RealtimeEventType
  conversationId: string
  messageId?: string
  actorId: string
  recipientIds: string[]
}

type RealtimeEmitter = {
  emit: (eventName: "chat:event", payload: RealtimePayload) => void
}

declare global {
  var __wavechatRealtimeEmitter: RealtimeEmitter | undefined
}

export function broadcastChatEvent(payload: RealtimePayload) {
  globalThis.__wavechatRealtimeEmitter?.emit("chat:event", payload)
}
