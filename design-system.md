# Project Huddle - Design System & UI Guide

This document outlines the visual language, color palette, and UI components used in Project Huddle.

---

## 🎨 Color Palette

We use a "High Contrast" system with a dedicated Primary Brand Color.

### 🔵 Primary Brand Color (Dynamic)
The app is built to allow the Primary Color to be customizable by the Admin.
* **Default:** Blue-600 (`#2563EB`)
* **Usage:** Buttons, Active Tabs, Progress Bars, Brand Borders.
* **Tailwind Ref:** `bg-blue-600` (Default), or inline styles via `branding.primary_color`.

### 🌑 Neutral Scale (Light Mode)
* **Background:** `bg-gray-50` (App Background)
* **Surface:** `bg-white` (Cards, Modals)
* **Text Main:** `text-gray-900` (Headings)
* **Text Muted:** `text-gray-500` (Subtitles, Meta data)
* **Borders:** `border-gray-200`

### 🌙 Neutral Scale (Dark Mode)
* **Background:** `dark:bg-gray-900` (App Background)
* **Surface:** `dark:bg-gray-800` (Cards, Modals)
* **Text Main:** `dark:text-white` (Headings)
* **Text Muted:** `dark:text-gray-400` (Subtitles)
* **Borders:** `dark:border-gray-700`

---

## 🔠 Typography

We use the default **Inter** font stack provided by Tailwind CSS.

* **H1 (Page Titles):** `text-2xl` or `text-3xl`, `font-bold`.
* **H2 (Section Headers):** `text-xl`, `font-bold`.
* **H3 (Card Headers):** `text-lg`, `font-bold`.
* **Body Text:** `text-base` or `text-sm`, `font-medium`.
* **Labels/Meta:** `text-xs`, `uppercase`, `font-bold`, `tracking-wide`.

---

## 🧩 UI Components

### 1. Cards (The "Modern" Style)
Cards are the fundamental building blocks of the dashboard.
* **Light:** White background, Shadow-md, Gray-200 border.
* **Dark:** Gray-800 background, Gray-700 border.
* **Feature:** Some cards use a colored top border (`border-t-4`) to denote importance or interactivity.

```tsx
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
  {/* Content */}
</div>