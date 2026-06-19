# StudyPilot AI

An AI-powered academic productivity assistant for students. The MVP helps students add assignments, get an explainable next-task recommendation, run focus sessions, and track lightweight progress.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Firebase Authentication
- Firestore
- Vercel serverless API functions
- OpenAI API

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in Firebase client values and server values in `.env.local`.

4. Start the app:

   ```bash
   npm run dev
   ```

## Environment Variables

Browser variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Server variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## MVP Flow

1. Sign up or log in.
2. Complete study preference onboarding.
3. Add courses and assignments.
4. Refresh the dashboard recommendation.
5. Start a focus session from the recommended task.
6. Review progress and adjust preferences.

## Scripts

- `npm run dev` starts Vite.
- `npm run build` type-checks and builds production assets.
- `npm run lint` runs ESLint.
- `npm run test` runs Vitest.

## Branch Strategy

- `main` stays deployable.
- `dev` is the integration branch.
- Use `feature/<short-name>` for issues and PRs into `dev`.
- Deploy production from `main` and Vercel previews from PRs.