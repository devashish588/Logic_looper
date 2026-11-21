# ♾️ Logic Looper

**Logic Looper** is a high-performance, daily logic puzzle platform built with a **Client-First Architecture**. Designed for daily engagement over a 365-day cycle, it minimizes server dependency while providing a polished, interactive user experience.

## 🌟 Project Philosophy
* **Client-First Architecture:** Maximum logic execution occurs on the client side to ensure zero-latency gameplay.
* **Server Efficiency:** Minimized read/write operations to the PostgreSQL database to optimize performance and reduce infrastructure costs.
* **Daily Engagement:** A GitHub-style streak system and heatmap to drive user retention.
* **Human-Centric Design:** A professional aesthetic using a custom color palette, replacing emojis with clean, modern UI elements.

---

## 🎮 Features
* **11 Puzzle Types:** Number Matrix, Sequence Solver, Deduction Grid, Binary Logic, plus **Switchboard** (lights-out), **Laser Path** (steer a beam with mirrors), **Measure Up** (jug puzzles), **Balance Scales** (live-tilting algebra), **Pixel Logic** (nonogram), **Number Trail** (one-path puzzle) and **Letter Lock** (a daily five-letter word with green/yellow/grey feedback). Most of the newer ones check themselves the moment you solve them.
* **Provably Fair Puzzles:** Every generated puzzle is verified: a unique solution, solvable by reasoning (no guessing), with hints that lead somewhere.
* **Deterministic Generation:** Puzzles are generated locally based on a date seed, ensuring every user plays the same puzzle daily without server calls. Difficulty follows the week: easy on Monday, hard on Sunday.
* **Streak Freezes:** Every 7 days in a row earns a freeze (hold up to 2) that automatically protects your streak if you miss a day.
* **Practice Archive & Free Play:** Replay any puzzle from the past year, or play unlimited puzzles of any type and difficulty. Neither affects your streak or the leaderboard.
* **Share Grid:** Wordle-style, spoiler-free result sharing.
* **Leaderboard:** Today, this week, and all time.
* **Never Lose Progress:** Solve history is the single source of truth, backed up to the server and merged (never overwritten) across devices; it works offline and syncs when you're back online.
* **User-Scoped Progress:** Intelligent state management that prevents data leakage between different user accounts on the same device.
* **Interactive UI:** Smooth transitions and feedback powered by Framer Motion and a professional navy/cyan color palette.

---

## 🛠️ Tech Stack

### Frontend
* **React 18+:** Functional components with Hooks for a modern UI.
* **Tailwind CSS:** Utility-first styling for a clean, professional look.
* **Framer Motion:** High-quality animations and interactive feedback.
* **Crypto-js:** Secure client-side puzzle validation and deterministic seeding.
* **IndexedDB:** Browser-based storage for offline play and persistent user state.

### Backend
* **Node.js & Express:** Lightweight API for essential user synchronization.
* **PostgreSQL (Neon.tech):** Serverless Postgres for reliable, scalable data storage.
* **Prisma ORM:** Type-safe database access and automated migrations.
* **NextAuth.js:** Secure authentication supporting Google OAuth and Truecaller SDK.

---

## 🎨 Branding & Identity
The project utilizes a custom, sophisticated color palette to ensure a professional feel:
* **Deep Navy (`#0B2D72`):** Primary branding and backgrounds.
* **Ocean Blue (`#0992C2`):** Secondary interactive elements.
* **Electric Cyan (`#0AC4E0`):** Success states and action highlights.
* **Sand Cream (`#F6E7BC`):** Soft background surfaces for reduced eye strain.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* PostgreSQL instance (or a Neon.tech account)

### Installation
1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/logic-looper.git](https://github.com/yourusername/logic-looper.git)
    cd logic-looper
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the `backend` directory:
    ```env
    DATABASE_URL="your_postgresql_connection_string"
    JWT_SECRET="your_secret_key"
    ```

4.  **Database Migration:**
    ```bash
    cd backend
    npx prisma db push
    ```

5.  **Run the Application:**
    ```bash
    npm run dev
    ```

---

## 📂 Project Structure
```text
logic-looper/
├── frontend/           # React + Vite application
│   ├── src/components/ # Reusable UI components
│   └── src/store/      # State management logic
├── backend/            # Node.js + Express API
│   ├── prisma/         # Database schema
│   └── src/index.js    # API entry point
└── .agent/             # Custom Antigravity architecture rules