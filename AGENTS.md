# AGENTS.md — AI Assistant Context for `kutubuku`

This document provides context, architectural rules, and database guidelines for AI coding agents working on **`kutubuku`**.

---

## 1. What is `kutubuku`?
**`kutubuku`** is a gamified reading journal and reading schedule planner (inspired by Duolingo and Strava, tailored for book owners).
- **Important Domain Rule:** Users **do not read full book texts inside this app**. Users log physical or digital books they already own (`user_book`), track daily reading progress (`progress_log`), follow generated reading schedules (`reading_schedule` + `schedule_day`), and stay motivated via streaks, badges (`badge` + `user_badge`), and annual challenges (`reading_challenge`).
- **Academic Context:** Developed as the Final Project for **Database Technology (`COMP6852004`)**, Class **BH20**, at **BINUS University**.
  - Uses the **15 normalized relational tables** defined in [`db/schema.sql`](db/schema.sql) (adopted from [`KutuBukuu(6).sql`](KutuBukuu(6).sql)) with BINUS Lab-style `CHAR(10)` regex-checked primary keys (`^BK\d{8}$`, `^US\d{8}$`, etc.).
  - Hosted on **Supabase (PostgreSQL)** and deployed on **Vercel** (not Railway).

---

## 2. Tech Stack & Conventions

- **Framework:** SvelteKit (`@sveltejs/kit` v3) with **Svelte 5 Runes** (`$props()`, `$state()`, `$derived()`, `$effect()`).
  - *Never* use legacy Svelte 4 syntax (`export let`, `$:`, `on:click`). Always use Svelte 5 runes and standard HTML event attributes (`onclick`).
- **Styling:** Tailwind CSS v4 (`@import 'tailwindcss';` in [`src/routes/layout.css`](src/routes/layout.css)).
  - Visual style: Duolingo-inspired tactile cards (`rounded-2xl border-2 border-zinc-200`), bold typography (`font-extrabold`), mobile-first centered column with desktop companion panel.
- **Database & Hosting:**
  - **Database:** **Supabase** (Cloud-hosted PostgreSQL + `@supabase/supabase-js` or `postgres` via Supabase Transaction Pooler).
  - **Frontend/Backend Hosting:** **Vercel** (Serverless SvelteKit).
- **AI Integration (BYOK):**
  - Users can supply their own free **Google Gemini API key** (stored in browser `localStorage`) to generate realistic reading schedules and verify reading notes.

---

## 3. Database Architecture (15 Tables in `db/schema.sql`)

When writing backend loaders (`+page.server.ts`, `+server.ts`) or updating TypeScript types in [`src/lib/types.ts`](src/lib/types.ts), keep them aligned with the 15 PostgreSQL tables in [`db/schema.sql`](db/schema.sql):

1. `publisher` (`PU\d{8}`) — Book publishers (`publisherID`, `publisherName`).
2. `author` (`AU\d{8}`) — Authors (`authorID`, `authorName`, `biography`, `birthDate`, `nationality`).
3. `genre` (`GN\d{8}`) — Book genres (`genreID`, `genreName`).
4. `book` (`BK\d{8}`) — Master book catalog (`bookID`, `publisherID`, `title`, `isbn13`, `publishDate`, `pageCount`, `description`).
5. `book_author` — M:N junction table (`bookID`, `authorID`).
6. `book_genre` — M:N junction table (`bookID`, `genreID`).
7. `app_user` (`US\d{8}`) — User account & streak stats (`userID`, `userName`, `userEmail`, `passwordHash`, `registerDate`, `timezone`, `maxConcurrentBooks`, `currentStreak`, `longestStreak`, `lastActivityDate`).
8. `user_book` (`UB\d{8}`) — Personal book shelf (`userBookID`, `userID`, `bookID`, `status` [`planned`, `reading`, `paused`, `finished`, `dropped`], `currentPage`, `startDate`, `endDate`, `dropReason`).
9. `progress_log` (`PL\d{8}`) — Reading sessions (`progressLogID`, `userBookID`, `logDate`, `startPage`, `pagesRead`, `currentPage`, `minutesRead`, `note`). Enforces `currentPage = startPage + pagesRead`.
10. `reading_schedule` (`RS\d{8}`) — Schedule header per `user_book` (`scheduleID`, `userBookID`, `startDate`, `targetFinishDate`, `pagesPerDayTarget`, `estimatedPagesPerDay`, `predictedFinishDate`, `status`).
11. `schedule_reading_day` — Preferred days of week 1–7 (`scheduleID`, `dayOfWeek`).
12. `schedule_day` (`SD\d{8}`) — Scheduled calendar days (`scheduleDayID`, `scheduleID`, `scheduledDate`, `targetPages`, `status` [`pending`, `completed`, `missed`]).
13. `badge` (`BD\d{8}`) — Master achievement badges (`badgeID`, `badgeName`, `description`, `iconURL`, `criteriaType`, `criteriaValue`).
14. `user_badge` — M:N unlocked badges (`userID`, `badgeID`, `awardedAt`).
15. `reading_challenge` (`RC\d{8}`) — Annual reading goal (`challengeID`, `userID`, `challengeYear`, `targetBooks`, `targetPages`).

---

## 4. Server vs. Client Security Rules

- **Never import database credentials or service-role keys in `.svelte` files or universal `+page.ts` files.**
- All Supabase server queries must live inside `src/lib/server/` and be called from `+page.server.ts`, `+layout.server.ts`, or `+server.ts`.
