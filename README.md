

♾️ Logic Looper
Logic Looper is a high-performance, daily logic puzzle platform built with a Client-First Architecture. Designed for daily engagement over a 365-day cycle, it minimizes server dependency while providing a polished, interactive user experience.

🌟 Project Philosophy
Client-First Architecture: Maximum logic execution occurs on the client side to ensure zero-latency gameplay.

Server Efficiency: Minimized read/write operations to the PostgreSQL database to optimize performance and reduce infrastructure costs.

Daily Engagement: A GitHub-style streak system and heatmap to drive user retention.

Human-Centric Design: A professional aesthetic using a custom color palette, replacing emojis with clean, modern UI elements.

🎮 Features
365 Unique Puzzles: Pre-generated puzzles stored client-side for a full year of content.

Deterministic Generation: Puzzles are generated locally based on a date seed, ensuring every user plays the same puzzle daily without server calls.

Offline Support: Full functionality without an internet connection using IndexedDB for local progress persistence.

User-Scoped Progress: Intelligent state management that prevents data leakage between different user accounts on the same device.

Interactive UI: Smooth transitions and feedback powered by Framer Motion and a professional navy/cyan color palette.

🛠️ Tech Stack
Frontend
React 18+: Functional components with Hooks for a modern UI.

Tailwind CSS: Utility-first styling for a clean, professional look.

Framer Motion: High-quality animations and interactive feedback.

Crypto-js: Secure client-side puzzle validation and deterministic seeding.

IndexedDB: Browser-based storage for offline play and persistent user state.

Backend
Node.js & Express: Lightweight API for essential user synchronization.

PostgreSQL (Neon.tech): Serverless Postgres for reliable, scalable data storage.

Prisma ORM: Type-safe database access and automated migrations.

NextAuth.js: Secure authentication supporting Google OAuth and Truecaller SDK.

🎨 Branding & Identity
The project utilizes a custom, sophisticated color palette to ensure a professional feel:

Deep Navy (#0B2D72): Primary branding and backgrounds.

Ocean Blue (#0992C2): Secondary interactive elements.

Electric Cyan (#0AC4E0): Success states and action highlights.

Sand Cream (#F6E7BC): Soft background surfaces for reduced eye strain.

🚀 Getting Started
Prerequisites
Node.js (v18 or higher)

PostgreSQL instance (or a Neon.tech account)

Installation
Clone the repository:

Bash
git clone https://github.com/yourusername/logic-looper.git
cd logic-looper
Install dependencies (Monorepo):

Bash
npm install
Environment Setup: Create a .env file in the backend directory:

Code snippet
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_secret_key"
Database Migration:

Bash
cd backend
npx prisma db push
Run the Application: Return to the root directory and run both frontend and backend simultaneously:

Bash
npm run dev
📂 Project Structure
Plaintext
logic-looper/
├── frontend/           # React + Vite application
│   ├── src/components/ # Reusable UI components
│   └── src/store/      # State management logic
├── backend/            # Node.js + Express API
│   ├── prisma/         # Database schema
│   └── src/index.js    # API entry point
└── .agent/             # Custom Antigravity architecture rules