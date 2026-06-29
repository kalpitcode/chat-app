# WaveChat

WaveChat is a WhatsApp-style chat app built with Next.js, React, Prisma, JWT authentication, and a local SQLite database.

## Features

- email signup and login
- seeded demo accounts
- WhatsApp-like chat layout
- direct messaging between contacts
- message seen state
- auto-refreshing conversations
- local development with Next.js

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo Accounts

- `riya@chat.local` / `demo123`
- `kabir@chat.local` / `demo123`
- `aanya@chat.local` / `demo123`
- `zoya@chat.local` / `demo123`

## Notes

- The `.env` file is intentionally ignored, so you should create your own local environment file if needed.
- The dev server is configured to use webpack because Turbopack was failing in this Windows environment.
