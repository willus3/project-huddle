# Project Huddle - Code Style & Development Guide

This document outlines the coding standards, architectural patterns, and best practices for **Project Huddle**, a B2B SaaS application.

## 🛠 Tech Stack

* **Frontend:** Next.js (React), TypeScript, Tailwind CSS.
* **Backend:** Node.js, Express.js.
* **Database:** PostgreSQL (Neon.tech).
* **Deployment:** Vercel (Client) + Render (Server).

---

## 📂 Directory Structure

The project follows a **Monorepo-style** structure separating Client and Server.

```text
project-huddle/
├── client/                 # Frontend (Next.js)
│   ├── app/                # App Router (Pages & Layouts)
│   ├── components/         # Reusable UI Components (Matrix, Kanban)
│   ├── public/             # Static Assets
│   └── tailwind.config.ts  # Design System & Dark Mode Config
├── server/                 # Backend (Node/Express)
│   ├── index.js            # Main Server Entry Point
│   └── db.js               # Database Connection (pg pool)
└── code-style.md           # This guide