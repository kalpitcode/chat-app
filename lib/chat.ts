import bcrypt from "bcrypt"
import prisma from "@/lib/prisma"

const DEMO_PASSWORD = "demo123"

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

export function orderParticipantIds(userId: string, contactId: string) {
  return userId < contactId ? [userId, contactId] : [contactId, userId]
}

export async function ensureDemoData() {
  const existingUsers = await prisma.user.count()

  if (existingUsers > 0) {
    return
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

  const [riya, kabir, aanya, zoya] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Riya Sharma",
        email: "riya@chat.local",
        passwordHash,
        avatarSeed: "riya",
        about: "Online and planning the weekend."
      }
    }),
    prisma.user.create({
      data: {
        name: "Kabir Mehta",
        email: "kabir@chat.local",
        passwordHash,
        avatarSeed: "kabir",
        about: "Shipping ideas fast."
      }
    }),
    prisma.user.create({
      data: {
        name: "Aanya Singh",
        email: "aanya@chat.local",
        passwordHash,
        avatarSeed: "aanya",
        about: "Coffee first, code second."
      }
    }),
    prisma.user.create({
      data: {
        name: "Zoya Khan",
        email: "zoya@chat.local",
        passwordHash,
        avatarSeed: "zoya",
        about: "Always up for a quick call."
      }
    })
  ])

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
        lastMessage: conversation.messages[0] ?? null,
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
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      seenAt: null
    },
    data: {
      seenAt: new Date()
    }
  })

  return prisma.conversation.findFirst({
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
}
