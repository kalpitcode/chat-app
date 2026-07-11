# WaveChat

WaveChat is a recruiter-ready WhatsApp-inspired chat application built with Next.js 16, Prisma, SQLite, JWT authentication, and WebSockets. It focuses on the features that make a messaging product feel real: live updates, attachment handling, message editing and deletion, validation, and a polished chat-first interface.

## Highlights

- Real-time messaging with a custom WebSocket server
- Direct conversations with contact sidebar and unread state
- File uploads with preview support for images and PDFs
- Edit and soft-delete message flows
- Seen state updates and chat refresh synchronization
- JWT-based authentication with seeded demo users
- Input validation and lightweight in-memory rate limiting
- API and validation tests with Vitest

## Tech Stack

- Next.js 16 App Router
- React 19
- Prisma ORM
- SQLite
- WebSocket support with `ws`
- Zod validation
- Vitest for tests

## Local Setup

1. Clone the repository.
2. Copy `.env.example` to `.env`.
3. Install dependencies.
4. Create the local database.
5. Start the development server.

```bash
npm install
npx prisma db push
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create a local `.env` file based on `.env.example`.

Required values:

- `DATABASE_URL="file:./dev.db"`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL=http://localhost:3000`

Optional values:

- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- Azure AD credentials if OAuth is needed later

## Demo Accounts

The app seeds demo users automatically on first login/signup request.

- `riya@chat.local` / `Demo1234`
- `kabir@chat.local` / `Demo1234`
- `aanya@chat.local` / `Demo1234`
- `zoya@chat.local` / `Demo1234`

## Core User Flows

- Sign up or log in with email and password
- Open a direct conversation from the contacts list
- Send text messages in real time
- Upload images or PDFs with optional captions
- Edit a recent message inside the allowed time window
- Delete a message with soft-delete behavior
- See message delivery state updates in the conversation view

## Project Structure

```text
app/
  api/                 API routes for auth, chats, uploads, and messages
  chat/                Main chat UI
  login/               Login and signup screen
lib/
  chat.ts              Chat service and data workflows
  realtime.ts          Realtime event broadcasting
  uploads.ts           Attachment persistence helpers
  validators.ts        Zod schemas and file validation
prisma/
  schema.prisma        Database schema
server.cjs             Custom Next.js + WebSocket dev/prod server
```

## Quality Checks

```bash
npm run lint
npm test
```

## Why This Project Stands Out

- It goes beyond a static UI clone and implements product behavior recruiters can inspect.
- It shows backend, frontend, validation, realtime, and testing work in one codebase.
- It is easy to run locally with SQLite and seeded demo users.

## Known Local Dev Notes

- On Windows, if a stale Next.js lock appears, stop old Node processes and restart the app.
- If you move the project to a new folder, keep `DATABASE_URL` pointed at a writable local SQLite file such as `file:./dev.db`.
- The custom server uses webpack mode because this environment was more stable than Turbopack during development.

## Next Improvements

- Typing indicators and presence state
- Voice notes and richer media support
- Persistent rate limiting with Redis
- End-to-end tests and deployment pipeline
