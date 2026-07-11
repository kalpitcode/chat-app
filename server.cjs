const http = require("node:http")
const { parse } = require("node:url")
const { EventEmitter } = require("node:events")
const next = require("next")
const { WebSocketServer } = require("ws")
const jwt = require("jsonwebtoken")

const dev = process.argv[2] !== "start"
const hostname = process.env.HOST || process.env.HOSTNAME || "0.0.0.0"
const port = Number(process.env.PORT || 3000)
const app = next({ dev, hostname, port, webpack: true })
const handle = app.getRequestHandler()
const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "supersecretkey"

if (!global.__wavechatRealtimeEmitter) {
  global.__wavechatRealtimeEmitter = new EventEmitter()
}

const realtimeEmitter = global.__wavechatRealtimeEmitter
const userSockets = new Map()

function addSocket(userId, socket) {
  const existingSockets = userSockets.get(userId) || new Set()
  existingSockets.add(socket)
  userSockets.set(userId, existingSockets)
}

function removeSocket(userId, socket) {
  const existingSockets = userSockets.get(userId)
  if (!existingSockets) {
    return
  }

  existingSockets.delete(socket)

  if (existingSockets.size === 0) {
    userSockets.delete(userId)
  }
}

function sendToUser(userId, payload) {
  const sockets = userSockets.get(userId)

  if (!sockets) {
    return
  }

  const serialized = JSON.stringify(payload)

  for (const socket of sockets) {
    if (socket.readyState === socket.OPEN) {
      socket.send(serialized)
    }
  }
}

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url || "", true)
    handle(req, res, parsedUrl)
  })

  const wss = new WebSocketServer({ noServer: true })

  realtimeEmitter.on("chat:event", (payload) => {
    for (const userId of payload.recipientIds || []) {
      sendToUser(userId, payload)
    }
  })

  server.on("upgrade", (request, socket, head) => {
    const { pathname, query } = parse(request.url || "", true)

    if (pathname !== "/ws") {
      socket.destroy()
      return
    }

    const token = typeof query.token === "string" ? query.token : ""

    if (!token) {
      socket.destroy()
      return
    }

    try {
      const decoded = jwt.verify(token, jwtSecret)

      if (!decoded || typeof decoded === "string" || typeof decoded.userId !== "string") {
        socket.destroy()
        return
      }

      const userId = decoded.userId

      wss.handleUpgrade(request, socket, head, (ws) => {
        addSocket(userId, ws)

        ws.on("close", () => {
          removeSocket(userId, ws)
        })

        ws.send(JSON.stringify({ type: "socket:ready", userId }))
        wss.emit("connection", ws, request)
      })
    } catch {
      socket.destroy()
    }
  })

  server.listen(port, hostname, () => {
    const localUrl = `http://localhost:${port}`
    const boundUrl = `http://${hostname}:${port}`

    console.log(`> Local:   ${localUrl}`)

    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      console.log(`> Network: ${boundUrl}`)
    }
  })
})
