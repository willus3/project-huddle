🚀 Project Huddle
Project Huddle is a B2B Micro-SaaS application designed to digitize the "Daily Huddle" process used in Lean Manufacturing. It replaces physical whiteboards and sticky notes with a real-time digital dashboard, allowing hybrid and on-site teams to capture, triage, and track continuous improvement ideas.

🌟 Features
💡 Idea Capture: Simple submission form for employees to log problems and proposed solutions.

📊 Impact/Effort Matrix: A drag-and-drop triage board to categorize ideas (Quick Wins vs. Major Projects).

✅ Execution Kanban: Track ideas through timelines (Quick Win, 30 Days, 90 Days, 1 Year).

📈 KPI Dashboards: Real-time tracking of team goals vs. actual submissions.

🏢 Company Leaderboard: Gamified view showing how different departments compare.

⚙️ Admin Portal: Manager-only access to create Departments (Teams) and Onboard Employees.

🛠️ Tech Stack
Frontend: React (Next.js 15), Tailwind CSS

Backend: Node.js, Express.js

Database: PostgreSQL

State Management: React Hooks (useState, useEffect)

⚙️ Setup & Installation
Follow these steps to run the project locally.

1. Database Setup (PostgreSQL)
Ensure you have PostgreSQL installed and running.

Open your terminal/command prompt.

Enter the Postgres shell: psql postgres

Create the database:

SQL

CREATE DATABASE project_huddle;
\c project_huddle
Run the SQL Schema (Create Tables). See server/database.sql for the full schema.

2. Backend Setup (Server)
The backend runs on Port 5000.

Bash

cd server
npm install
node index.js
You should see: Server has started on port 5000

3. Frontend Setup (Client)
The frontend runs on Port 3000. Open a new terminal window:

Bash

cd client
npm install
npm run dev
Open your browser to http://localhost:3000

🔑 Usage & Demo Accounts
The application uses role-based access control (Manager vs. Employee).

Manager Account
Email: demo@example.com

Password: (Any password works in dev mode)

Capabilities: View all teams, Edit Goals, Access ⚙️ Admin Portal to add users/teams.

Employee Account
Email: worker@acme.com

Password: (Any password works in dev mode)

Capabilities: Submit ideas, View own dashboard, View Team Huddle (Read-Only Matrix).

📂 Project Structure
project-huddle/
├── client/                 # Next.js Frontend
│   ├── app/
│   │   ├── components/     # Drag-and-Drop Boards (Matrix, Kanban)
│   │   └── page.tsx        # Main Application Logic (Dashboard, Admin, Tabs)
│   └── public/
├── server/                 # Node/Express Backend
│   ├── index.js            # API Routes (GET, POST, PUT)
│   ├── db.js               # Database Connection
│   └── database.sql        # SQL Schema Reference
└── README.md
🛣️ Roadmap (Upcoming Features)
[ ] Review Cycle Engine: Automatic flagging of long-term ideas (30/90 days) for weekly review.

[ ] Email Notifications: Notify users when their idea is approved or completed.

[ ] Mobile View: Optimized layout for shop-floor tablets.

📜 License
Private Learning Project.