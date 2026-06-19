# StudyPilot AI

An AI-powered academic productivity assistant for students. The current app uses the Figma-exported Adaptive Productivity prototype UI as the source of truth for layout, styling, navigation, and UX.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Figma-exported shadcn/Radix UI components
- Motion animations
- Recharts
- Mock AI planning data for local prototype testing

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

   The repo includes `.npmrc` with `legacy-peer-deps=true` because the Figma-exported prototype has older peer dependency ranges.

2. Start the app:

   ```bash
   npm run dev -- --host 127.0.0.1
   ```

3. Open the URL Vite prints, usually:

   ```text
   http://127.0.0.1:5173/
   ```

If port `5173` is already busy, start on another port:

   ```bash
   npm run dev -- --host 127.0.0.1 --port 5175
   ```

If the page is blank, stop the dev server, delete the local install, reinstall, and start again:

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev -- --host 127.0.0.1
   ```

## Prototype Routes

- `/` landing page
- `/dashboard` AI dashboard
- `/tasks` task planner
- `/focus` focus session
- `/ai` AI assistant
- `/progress` progress and gamification
- `/customize` themes and preferences

## Firebase/OpenAI Setup

The restored Figma prototype currently runs with mock AI/productivity data. Add Firebase/OpenAI later when the UI is approved and ready to be wired to real accounts and persistence.

1. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in Firebase client values and server values in `.env.local`.

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

## Prototype Flow

1. Open the landing page.
2. Click Get Started to enter the dashboard.
3. Review AI insights, workload, and Canvas-style deadlines.
4. Use Tasks, Focus, AI Assistant, Progress, and Customize from the sidebar.

## Scripts

- `npm run dev` starts Vite.
- `npm run build` builds production assets.
- `npm run lint` runs ESLint.
- `npm run test` runs Vitest.

## Branch Strategy

- `main` stays deployable.
- `dev` is the integration branch.
- Use `feature/<short-name>` for issues and PRs into `dev`.
- Deploy production from `main` and Vercel previews from PRs.