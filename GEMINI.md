# 🤖 Project Context for Gemini

**Project Name:** Project Huddle
**Description:** A B2B SaaS application for team improvement ideas, featuring a Matrix prioritization board and Kanban execution tracking.

---

## 🛠 Tech Stack & Architecture

| Component | Technology | Hosting |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS | Vercel |
| **Backend** | Node.js, Express.js | Render |
| **Database** | PostgreSQL | Neon.tech |
| **State** | React `useState` / `useEffect` (Client-side fetching) | N/A |
| **Styling** | Tailwind CSS (Dark Mode: `class` strategy) | N/A |

### 📂 Key Directory Structure
* **Root:** `project-huddle/`
* **Client:** `./client` (Contains Next.js app, `tailwind.config.ts`, `package.json`)
* **Server:** `./server` (Contains Express API, `db.js`, `package.json`)
* **Docs:** `./code-style.md`, `./design-system.md`

---

## 📝 Coding Standards & Patterns

### 1. Mobile-First Responsiveness
* **Default classes** = Mobile layout (Vertical stacks).
* **`md:`/`lg:` prefixes** = Desktop layout (Horizontal rows).
* **Example:** `<div className="flex flex-col md:flex-row">`

### 2. Styling (Tailwind)
* **Dark Mode:** Enabled via `darkMode: 'class'`.
* **Colors:**
    * Primary: Dynamic (user-defined), defaults to Blue-600 (`#2563EB`).
    * Cards (Light): `bg-white border-gray-200`
    * Cards (Dark): `dark:bg-gray-800 dark:border-gray-700`
    * Backgrounds: `bg-gray-50` -> `dark:bg-gray-900`

### 3. Frontend Data Fetching
* **Pattern:** "Smart Container / Dumb Component".
* **Logic:** `client/app/page.tsx` handles all `fetch()` calls and state.
* **Props:** Data is passed down to presentation components (`MatrixBoard.tsx`, `KanbanBoard.tsx`).
* **API URL:** Uses `process.env.NEXT_PUBLIC_API_URL`.

### 4. Backend & Database
* **Connection:** `pg` pool in `server/db.js`.
* **Security:** ALWAYS use parameterized queries (`$1`, `$2`) to prevent SQL injection.
* **Environment:** Production uses `DATABASE_URL` (Neon string), Local uses `localhost` config.

---

## 🚀 Deployment Pipeline (Hybrid)

* **Frontend (Vercel):** Connected to GitHub. Deploys from `./client`.
* **Backend (Render):** Connected to GitHub. Deploys from `./server`.
* **Workflow:** Push to `main` -> Auto-deploy both ends.

---

## ⚠️ Known Constraints & quirks
1.  **Tailwind Config Location:** Must exist in `./client/tailwind.config.ts` for Dark Mode to work.
2.  **Vercel Root:** Vercel project settings must point Root Directory to `client`.
3.  **Render Root:** Render service settings must point Root Directory to `server`.

---

## 🎯 Current Project Status
* **Phase:** Post-MVP / Polish.
* **Recent Features:** Mobile responsiveness, Dark Mode, Admin branding settings.
* **Next Steps:** (Update this section as we progress)
    * [ ] Add email notifications.
    * [ ] Add user profile image uploads.
    * [ ] Refactor into multiple pages (currently Single Page App style).