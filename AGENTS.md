# AGENTS.md — AI Assistant Context for `kutubuku`

This document provides context, architectural rules, and database guidelines for AI coding agents working on **`kutubuku`**.

---

## 1. What is `kutubuku`?
**`kutubuku`** is a gamified reading journal and AI-powered reading schedule planner (inspired by Duolingo and Strava, tailored for book owners).
- **Important Domain Rule:** Users **do not read full book texts inside this app**. Users log physical or digital books they already own, track daily reading sessions (pages & minutes), verify their reading comprehension via AI, follow generated weekly reading schedules (*jadwal baca*), and stay motivated via streaks, XP, badges, and friend celebrations ("Bros").
- **Academic Context:** Developed as the Final Project for **Database Technology (`COMP6852004`)**, Class **BH20**, at **BINUS University**.
  - Must maintain **at least 10 normalized relational tables** (currently 12 tables in [`db/schema.sql`](db/schema.sql)).
  - Must clearly demonstrate raw SQL DDL/DML compatibility with **pgAdmin 4** and **Supabase PostgreSQL**.

---

## 2. Tech Stack & Conventions

- **Framework:** SvelteKit (`@sveltejs/kit` v2/v3) with **Svelte 5 Runes** (`$props()`, `$state()`, `$derived()`, `$effect()`).
  - *Never* use legacy Svelte 4 syntax (`export let`, `$:`, `on:click`). Always use Svelte 5 runes and standard HTML event attributes (`onclick`).
- **Styling:** Tailwind CSS v4 (`@import 'tailwindcss';` in [`src/routes/layout.css`](src/routes/layout.css)).
  - Visual style: Duolingo-inspired tactile cards (`rounded-2xl border-2 border-zinc-200`), bold typography (`font-extrabold`), mobile-first centered column with desktop companion panel.
- **Database & Hosting:**
  - **PostgreSQL** hosted on **Supabase** (compatible with **pgAdmin 4** for university lab demonstrations).
  - **Deployed on:** **Vercel**.
- **AI Integration (BYOK):**
  - Users can supply their own free **Google Gemini API key** (stored client-side or encrypted per user) to power two features:
    1. **Weekly Schedule Generation (`reading_plans` + `reading_plan_items`):** Spreading weekly page targets across unfinished books.
    2. **Session Verification (`session_verifications`):** Asking a quick comprehension/reflection prompt when logging pages to prevent fake streak farming.

---

## 3. Database Architecture (12 Tables in `db/schema.sql`)

When writing backend loaders (`+page.server.ts`, `+server.ts`) or updating TypeScript types in [`src/lib/types.ts`](src/lib/types.ts), keep them aligned with the 12 PostgreSQL tables defined in [`db/schema.sql`](db/schema.sql):

1. `users` — User profile, daily goals (`daily_target_pages`, `daily_target_minutes`), `has_gemini_key`.
2. `user_stats` — 1:1 gamification state (`streak_days`, `longest_streak`, `last_read_date`, `total_xp`, `current_level`, `today_pages_read`).
3. `genres` — 3NF lookup table for book genres.
4. `books` — Owned books (`user_id`, `genre_id`, `title`, `author`, `total_pages`, `current_page`, `status`).
5. `reading_sessions` — Logged sessions (`user_id`, `book_id`, `pages_read`, `start_page`, `end_page`, `minutes_read`, `notes`, `xp_earned`, `is_verified`, `logged_at`).
6. `session_verifications` — AI anti-cheat check (`session_id`, `ai_prompt`, `user_response`, `ai_feedback`, `verification_status`, `bonus_xp`).
7. `reading_plans` — Weekly schedule header (`user_id`, `week_start_date`, `week_end_date`, `target_pages_per_day`, `projected_weekly_pages`, `ai_rationale`).
8. `reading_plan_items` — Daily book/page targets (`plan_id`, `book_id`, `scheduled_date`, `target_pages`, `actual_pages_read`, `is_completed`).
9. `badges` — Master achievement definitions (`code`, `title`, `description`, `icon`, `requirement_type`, `requirement_value`).
10. `user_badges` — M:N junction table of unlocked badges per user.
11. `friendships` — Social graph between users (`requester_id`, `addressee_id`, `status`).
12. `session_celebrations` — "Celebrate 🎉" reactions on friends' reading sessions (`session_id`, `from_user_id`).

---

## 4. Server vs. Client Security Rules

- **Never import database credentials or PostgreSQL drivers in `.svelte` files or universal `+page.ts` files.**
- All database connections must live inside `src/lib/server/` and only be called from `+page.server.ts`, `+layout.server.ts`, or `+server.ts` routes.
- When connecting to **Supabase PostgreSQL from Vercel** (serverless environment), use the **Supabase Transaction Pooler URL** (port `6543`) with `{ prepare: false }` if using the `postgres` npm package, or use `@supabase/supabase-js`.

