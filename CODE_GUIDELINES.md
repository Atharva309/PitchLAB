# PitchLab / version-simli — Code Guidelines

Reference this file for all changes in `version-simli/`. Do **not** modify other version folders.

## Folder structure (core)

```
version-simli/
├── app/api/chat/route.ts      # GPT-4o persona replies
├── app/api/tts/route.ts       # ElevenLabs TTS
├── components/Avatar.tsx      # Simli WebRTC (reuse; do not break AvatarRef)
├── hooks/                     # Voice session orchestration
├── lib/constants.ts           # All magic numbers
├── types/index.ts             # All shared types
└── public/pcm-worker.js
```

## TypeScript

- Explicit parameter and return types on every function — no `any` unless unavoidable (comment why).
- Shared types only in `types/index.ts`.
- Prefer `const`; use `let` only when reassigned.
- No unused imports or variables.

## Comments

Every file needs:

1. **File-level** JSDoc (2–3 lines): what, what it connects to, why.
2. **Function-level** JSDoc: inputs, outputs, behavior.
3. **Inline** comments for non-obvious logic (chunk sizes, debounce, refs).
4. Section dividers: `// ── Section Name ───`

## Naming

| Type | Convention |
|------|------------|
| Functions | camelCase, verb-first: `fetchChatReply` |
| Components | PascalCase: `Avatar` |
| Constants | SCREAMING_SNAKE_CASE: `DEBOUNCE_MS` |
| Types | PascalCase: `ChatMessage` |
| Booleans | `is` / `has` / `should` prefix |

## Constants

All magic numbers in `lib/constants.ts` — never scatter in components.

## Error handling

- API routes: try/catch, meaningful JSON errors.
- External services: graceful failures, user-facing messages in UI.
- No silent unhandled rejections.

## No dead code

Remove commented-out blocks, unused files, unused imports.

## Hard rules

- Do **not** touch `version-talkinghead`, `version-anam`, `version-heygen`, or repo root app files.
- Do **not** commit `.env.local`.
- Do **not** rename or remove `AvatarRef`.
- Do **not** change `/api/chat` or `/api/tts` paths.
- Run `npm run build` with zero errors before commit/deploy.

## Env template

See `.env.example` for OpenAI, ElevenLabs, Deepgram, Simli, Supabase.
