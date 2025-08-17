# Lesson Planner – Notion-style (Next.js)

A clean, color-coded lesson planner with calendar + list views, quick student assignment for a given date, local autosave, and **server-side GitHub sync** for multi-device access. Ready for `npm run dev` and Vercel deployment.

## ✨ Features
- Calendar & List views
- Color-coded Subjects (add/rename/recolor/delete)
- Students manager
- Quick assign: add selected students to **all lessons on the same date**
- Local autosave (browser)
- Export/Import JSON
- **GitHub Sync** via serverless API routes (token stays on server)

## 🚀 Quick Start
```bash
npm i
npm run dev
# open http://localhost:3000
```

## 🔗 GitHub Sync (server-side)
This project includes `/api/github/push` and `/api/github/pull` endpoints that use your **server-side** token.

1. Create a **Personal Access Token** in GitHub with `repo` content permissions.
2. Create `.env.local` and set:
```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
3. In the app **Settings** tab, fill **Owner**, **Repo**, **Branch** (default `main`), **Path** (default `data/lesson-planner.json`).
4. Click **Push now** to upload your data. Click **Pull** on another device to fetch it.

> When deploying on **Vercel**, add `GITHUB_TOKEN` as an **Environment Variable** in Project Settings.

## 🧱 Tech
- Next.js 14 (App Router)
- Tailwind CSS
- framer-motion, lucide-react

## 🧩 Google Classroom (optional scaffold)
You can extend the app with Google Classroom using Google Identity Services and the Classroom API. (Server routes can be added for OAuth exchanges if needed.)

## 📁 Project Structure
```
app/
  api/github/push/route.ts
  api/github/pull/route.ts
  page.tsx
  globals.css
components/
  LessonPlannerApp.tsx
  ui/...
lib/
  github.ts
  utils.ts
```

## 📦 Deploy
- **Vercel** (recommended): Import this repo, set `GITHUB_TOKEN` env, deploy.
- **GitHub Pages**: Convert to static with a SPA bundler if needed (Next.js SSR features removed). Vercel is easier.

---

Empress, change any wording, colors, or workflow and I’ll update the repo.
