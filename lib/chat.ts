import { Prisma } from "@prisma/client"
import bcrypt from "bcrypt"
import prisma from "@/lib/prisma"
import { broadcastChatEvent } from "@/lib/realtime"

const DEMO_PASSWORD = "Demo1234"
const demoSeedUsers = [
  {
    name: "Riya Sharma",
    email: "riya@chat.local",
    avatarSeed: "riya",
    about: "Online and planning the weekend."
  },
  {
    name: "Kabir Mehta",
    email: "kabir@chat.local",
    avatarSeed: "kabir",
    about: "Shipping ideas fast."
  },
  {
    name: "Aanya Singh",
    email: "aanya@chat.local",
    avatarSeed: "aanya",
    about: "Coffee first, code second."
  },
  {
    name: "Zoya Khan",
    email: "zoya@chat.local",
    avatarSeed: "zoya",
    about: "Always up for a quick call."
  }
] as const

type ChatUser = {
  id: string
  name: string
  email: string
  about: string | null
  avatarSeed: string | null
}

type ChatSummary = {
  id: string
  updatedAt: Date
  contact: ChatUser
  lastMessage: {
    id: string
    content: string
    createdAt: Date
    senderId: string
    seenAt: Date | null
  } | null
  unreadCount: number
}

function getMessagePreview(message: {
  deletedAt: Date | null
  attachmentName: string | null
  attachmentType: string | null
  content: string
}) {
  if (message.deletedAt) {
    return "This message was deleted"
  }

  if (message.content) {
    return message.content
  }

  if (message.attachmentType?.startsWith("image/")) {
    return "Photo"
  }

  if (message.attachmentName) {
    return `Attachment: ${message.attachmentName}`
  }

  return "Attachment"
}

export function orderParticipantIds(userId: string, contactId: string) {
  return userId < contactId ? [userId, contactId] : [contactId, userId]
}

export async function ensureDemoData() {
  const existingUsers = await prisma.user.count()
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

  if (existingUsers > 0) {
    const existingDemoUsers = await prisma.user.findMany({
      where: {
        email: {
          in: demoSeedUsers.map((user) => user.email)
        }
      },
      select: {
        email: true
      }
    })

    const existingEmails = new Set(existingDemoUsers.map((user) => user.email))

    await prisma.$transaction([
      ...demoSeedUsers
        .filter((user) => existingEmails.has(user.email))
        .map((user) =>
          prisma.user.update({
            where: { email: user.email },
            data: {
              name: user.name,
              passwordHash,
              avatarSeed: user.avatarSeed,
              about: user.about
            }
          })
        ),
      ...demoSeedUsers
        .filter((user) => !existingEmails.has(user.email))
        .map((user) =>
          prisma.user.create({
            data: {
              ...user,
              passwordHash
            }
          })
        )
    ])

    return
  }

  const [riya, kabir, aanya, zoya] = await Promise.all(
    demoSeedUsers.map((user) =>
      prisma.user.create({
        data: {
          ...user,
          passwordHash
        }
      })
    )
  )

  const seededConversations = [
    {
      participants: [riya.id, kabir.id] as const,
      messages: [
        { senderId: riya.id, content: "Did you review the new UI draft?" },
        { senderId: kabir.id, content: "Yes, the chat layout feels super clean already." },
        { senderId: riya.id, content: "Perfect. I want it to feel close to WhatsApp but still ours." }
      ]
    },
    {
      participants: [riya.id, aanya.id] as const,
      messages: [
        { senderId: aanya.id, content: "Can you send the meeting notes here?" },
        { senderId: riya.id, content: "Sending now. Also, test the mobile layout when you get a minute." }
      ]
    },
    {
      participants: [kabir.id, zoya.id] as const,
      messages: [
        { senderId: zoya.id, content: "Voice notes next or stickers next?" },
        { senderId: kabir.id, content: "Voice notes later. Let us get core messaging polished first." }
      ]
    }
  ]

  for (const seededConversation of seededConversations) {
    const conversation = await getOrCreateDirectConversation(
      seededConversation.participants[0],
      seededConversation.participants[1]
    )

    for (const seededMessage of seededConversation.messages) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: seededMessage.senderId,
          content: seededMessage.content
        }
      })
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        updatedAt: new Date()
      }
    })
  }
}

export async function getOrCreateDirectConversation(userId: string, contactId: string) {
  const [firstUserId, secondUserId] = orderParticipantIds(userId, contactId)

  return prisma.conversation.upsert({
    where: {
      firstUserId_secondUserId: {
        firstUserId,
        secondUserId
      }
    },
    update: {},
    create: {
      firstUserId,
      secondUserId
    }
  })
}

export function getConversationParticipantIds(conversation: {
  firstUserId: string
  secondUserId: string
}) {
  return [conversation.firstUserId, conversation.secondUserId]
}

const ownedMessageQuery = Prisma.validator<Prisma.MessageDefaultArgs>()({
  include: {
    conversation: true,
    sender: {
      select: {
        id: true,
        name: true,
        avatarSeed: true
      }
    }
  }
})

type OwnedMessage = Prisma.MessageGetPayload<typeof ownedMessageQuery>

export async function getChatSummaries(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ firstUserId: userId }, { secondUserId: userId }]
    },
    include: {
      firstUser: {
        select: {
          id: true,
          name: true,
          email: true,
          about: true,
          avatarSeed: true
        }
      },
      secondUser: {
        select: {
          id: true,
          name: true,
          email: true,
          about: true,
          avatarSeed: true
        }
      },
      messages: {
        orderBy: {
          createdAt: "desc"
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
          seenAt: true,
          deletedAt: true,
          attachmentName: true,
          attachmentType: true
        },
        take: 1
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  })

  const summaries = await Promise.all(
    conversations.map(async (conversation) => {
      const contact =
        conversation.firstUserId === userId ? conversation.secondUser : conversation.firstUser

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          senderId: { not: userId },
          seenAt: null
        }
      })

      return {
        id: conversation.id,
        updatedAt: conversation.updatedAt,
        contact,
        lastMessage: conversation.messages[0]
          ? {
              ...conversation.messages[0],
              content: getMessagePreview(conversation.messages[0])
            }
          : null,
        unreadCount
      } satisfies ChatSummary
    })
  )

  return summaries
}

export async function getContacts(userId: string) {
  return prisma.user.findMany({
    where: {
      id: { not: userId }
    },
    select: {
      id: true,
      name: true,
      email: true,
      about: true,
      avatarSeed: true
    },
    orderBy: {
      name: "asc"
    }
  })
}

export async function getConversationForUser(conversationId: string, userId: string) {
  const seenResult = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      seenAt: null
    },
    data: {
      seenAt: new Date()
    }
  })

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ firstUserId: userId }, { secondUserId: userId }]
    },
    include: {
      firstUser: {
        select: {
          id: true,
          name: true,
          email: true,
          about: true,
          avatarSeed: true
        }
      },
      secondUser: {
        select: {
          id: true,
          name: true,
          email: true,
          about: true,
          avatarSeed: true
        }
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarSeed: true
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  })

  if (conversation && seenResult.count > 0) {
    broadcastChatEvent({
      type: "message:seen",
      conversationId: conversation.id,
      actorId: userId,
      recipientIds: getConversationParticipantIds(conversation)
    })
  }

  return conversation
}

export async function getMessageForOwner(
  messageId: string,
  userId: string
): Promise<OwnedMessage | null> {
  return prisma.message.findFirst({
    where: {
      id: messageId,
      senderId: userId
    },
    ...ownedMessageQuery
  })
}

export async function createTextMessage(conversationId: string, senderId: string, content: string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ firstUserId: senderId }, { secondUserId: senderId }]
    }
  })

  if (!conversation) {
    return null
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId,
        content
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarSeed: true
          }
        }
      }
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })
  ])

  broadcastChatEvent({
    type: "message:created",
    conversationId,
    messageId: message.id,
    actorId: senderId,
    recipientIds: getConversationParticipantIds(conversation)
  })

  return message
}

export async function createAttachmentMessage(
  conversationId: string,
  senderId: string,
  payload: {
    content: string
    attachmentUrl: string
    attachmentType: string
    attachmentName: string
    attachmentSize: number
  }
) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ firstUserId: senderId }, { secondUserId: senderId }]
    }
  })

  if (!conversation) {
    return null
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: payload.content,
        attachmentUrl: payload.attachmentUrl,
        attachmentType: payload.attachmentType,
        attachmentName: payload.attachmentName,
        attachmentSize: payload.attachmentSize
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarSeed: true
          }
        }
      }
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })
  ])

  broadcastChatEvent({
    type: "message:created",
    conversationId,
    messageId: message.id,
    actorId: senderId,
    recipientIds: getConversationParticipantIds(conversation)
  })

  return message
}

export async function updateOwnMessage(messageId: string, userId: string, content: string) {
  const message = await getMessageForOwner(messageId, userId)

  if (!message || message.deletedAt) {
    return null
  }

  const editWindowMs = 15 * 60 * 1000
  if (Date.now() - message.createdAt.getTime() > editWindowMs) {
    const error = new Error("Edit window has expired")
    ;(error as Error & { status?: number }).status = 403
    throw error
  }

  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: {
      content,
      editedAt: new Date()
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatarSeed: true
        }
      }
    }
  })

  await prisma.conversation.update({
    where: { id: message.conversationId },
    data: { updatedAt: new Date() }
  })

  broadcastChatEvent({
    type: "message:updated",
    conversationId: message.conversationId,
    messageId,
    actorId: userId,
    recipientIds: getConversationParticipantIds(message.conversation)
  })

  return updatedMessage
}

export async function deleteOwnMessage(messageId: string, userId: string) {
  const message = await getMessageForOwner(messageId, userId)

  if (!message || message.deletedAt) {
    return null
  }

  const deletedMessage = await prisma.message.update({
    where: { id: messageId },
    data: {
      content: "",
      attachmentUrl: null,
      attachmentType: null,
      attachmentName: null,
      attachmentSize: null,
      deletedAt: new Date(),
      editedAt: null
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatarSeed: true
        }
      }
    }
  })

  await prisma.conversation.update({
    where: { id: message.conversationId },
    data: { updatedAt: new Date() }
  })

  broadcastChatEvent({
    type: "message:deleted",
    conversationId: message.conversationId,
    messageId,
    actorId: userId,
    recipientIds: getConversationParticipantIds(message.conversation)
  })

  return deletedMessage
}
