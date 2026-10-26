# kutubuku

> A gamified book journal web app that tracks your reading journey (streaks, XP, daily goals) and will later use AI to suggest what to read next week based on last week's reading.

**Status:** In development

> **Note:** Users do not read books on this platform. Kutubuku is a companion journal to track books you physically or digitally own, log reading sessions (pages/minutes), and maintain daily reading habits.

Developed for **Database Technology (COMP6852004)**, Class **BH20**, Computer Science — **BINUS University**.

---

## Features

### In Progress
- [x] Duolingo-style centered column responsive layout (mobile-first, e-ink friendly)
- [x] Dashboard with current streak count, XP, level progress bar, and 7-day habit strip
- [x] Daily goal visual tracking (progress ring and linear bar)
- [x] Book detail page with progress stats
- [x] Reading session logging form (stepper, optional minutes, optional notes)
- [x] Dynamic XP feedback toast and streak maintenance calculation (in-memory)

### Planned
- [ ] PostgreSQL database schema and connection
- [ ] User authentication and persistent profiles
- [ ] Book management (add, edit, remove owned books)
- [ ] Weekly AI reading planner powered by an LLM API
- [ ] Advanced reading analytics and historical reports

---

## Tech Stack

- **Framework:** SvelteKit (Svelte 5 runes)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4)
- **Database (Planned):** PostgreSQL
- **AI (Planned):** LLM API for personalized weekly reading plans

---

## Getting Started

### Prerequisites
- Node.js (v20.x or higher recommended)
- npm (v10.x or higher)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Abysswdh/kutubuku.git
   cd kutubuku
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Type-check and build for production:**
   ```bash
   # Run TypeScript & Svelte type checking
   npm run check

   # Build production bundle
   npm run build
   ```

---

## Project Structure

```text
src/
├── lib/
│   ├── components/       # Reusable UI components (ProgressBar, ProgressRing, BookCard, etc.)
│   ├── data/
│   │   └── mock.ts       # In-memory mock store and mutation functions
│   └── types.ts          # Core domain TypeScript interfaces matching DB entities
└── routes/
    ├── layout.css        # Tailwind v4 import, theme tokens, and typography
    ├── +layout.svelte    # Centered container layout with mobile bottom navigation
    ├── +layout.ts        # Layout data loader
    ├── +page.svelte      # Dashboard page
    ├── +page.ts          # Dashboard data loader
    └── books/
        └── [id]/
            ├── +page.svelte # Book detail and session logging form
            └── +page.ts     # Book-specific loader
```

---

## Git Workflow

To keep the repository clean and stable:

1. **Branch Protection:**
   - `main` is always stable and deployable.
   - **Never push directly to `main`**.
   - Use an optional `dev` branch for integrating completed features before merging into `main`.

2. **Branch Naming Conventions:**
   - `feat/<feature-name>` — New features (e.g., `feat/session-stepper`)
   - `fix/<bug-name>` — Bug fixes (e.g., `fix/streak-calculation`)
   - `chore/<task-name>` — Maintenance or config updates (e.g., `chore/tailwind-v4-setup`)
   - `docs/<doc-name>` — Documentation changes (e.g., `docs/update-readme`)

3. **Code Review & Pull Requests:**
   - Every change must be submitted via a Pull Request (PR).
   - Each PR requires an approval from at least one teammate before merging.

4. **Commit Message Format:**
   Use conventional prefixes:
   - `feat:` for new capabilities
   - `fix:` for bug fixes
   - `chore:` for tooling and dependency updates
   - `docs:` for documentation updates

---

## Team

**Class BH20 — BINUS University**

| Name | Student ID | Role | GitHub |
| :--- | :--- | :--- | :--- |
| Stella Olivia Setiadi | 2902652922 | Frontend / UI Engineer | [@stellaollie](https://github.com/stellaollie) |
| Putra Abyasa Wedha | 2902583635 | Fullstack / Database Engineer | [@Abysswdh](https://github.com/Abysswdh) |
| Ricky Satria Ardana | 2902567631 | Backend / AI Integration | [@RickySAT](https://github.com/RickySAT) |

---

## Roadmap

1. **Phase 1: Frontend MVP** (Current) — Svelte 5 frontend, responsive Duolingo-style layout, and mock data state.
2. **Phase 2: Database Integration** — PostgreSQL schema design, migrations, and repository layer.
3. **Phase 3: AI Reading Planner** — LLM prompt engineering and weekly schedule generation based on logged sessions.
4. **Phase 4: Deployment & Polish** — Cloud hosting, CI/CD pipeline, and responsive performance tuning.

---

## License

This project is licensed under the [MIT License](LICENSE) (placeholder).
