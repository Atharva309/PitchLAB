# PitchLab — AI Sales Training Platform

PitchLab is a full-stack sales training app built on the Simli voice avatar stack. Students complete a 6-stage simulation (lead gen → close); teachers create and publish scenarios.

## Stack

- **Next.js 13** App Router (`version-simli/`)
- **Supabase** — Postgres + Auth
- **Simli** — WebRTC avatar (`Avatar.tsx`)
- **OpenAI GPT-4o** — Persona replies + stage scoring
- **ElevenLabs** + **Deepgram** — TTS / STT

## Setup

1. Run `supabase/schema.sql` in your Supabase SQL editor.
2. Copy `.env.example` → `.env.local` and fill all keys (including Supabase).
3. Install and run:

```bash
cd version-simli
npm install
npm run dev
```

## Environment variables

See `.env.example` for OpenAI, ElevenLabs, Deepgram, Simli, and Supabase keys.

## Deploy (Vercel)

- **Root directory:** `version-simli`
- Add all env vars from `.env.local`
- `npm run build` must pass before deploy

```bash
npm run build
vercel --prod
```

## Project layout

See the Cursor spec for `app/(auth)`, `app/(student)`, `app/(teacher)`, `components/stages/`, and `lib/supabase/`.
