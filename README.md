# NONONICK Universal AI Editor

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-cyan.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-orange.svg)](https://firebase.google.com/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1.0-green.svg)](https://swagger.io/specification/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](https://www.docker.com/)

A production-grade, autonomous web, code, visual design, and database studio. Connects visual site design, code editing, live preview, an in-memory & file-persistent database with dynamic REST API endpoints, autonomous SEO metadata generator, and an OpenAI-compatible gateway for external AI chatbots and agents.

---

## 🌟 Table of Contents
- [1. Architecture & Tech Stack](#1-architecture--tech-stack)
- [2. Quick Start & Local Development](#2-quick-start--local-development)
- [3. Deployment Configuration](#3-deployment-configuration)
  - [Docker & Docker Compose](#docker--docker-compose)
  - [Google Cloud Run / Kubernetes / VPS](#google-cloud-run--kubernetes--vps)
- [4. Firebase & Firestore Integration](#4-firebase--firestore-integration)
  - [Authentication](#authentication)
  - [Firestore Security Rules](#firestore-security-rules)
  - [Indexes](#indexes)
- [5. Backend Architecture & API](#5-backend-architecture--api)
  - [OpenAI-Compatible Chat Completions](#openai-compatible-chat-completions)
  - [Universal Agent Webhook](#universal-agent-webhook)
  - [Dynamic Mock Database REST API](#dynamic-mock-database-rest-api)
  - [AI Studios Endpoints](#ai-studios-endpoints)
- [6. Frontend Architecture](#6-frontend-architecture)
- [7. OpenAPI Specification & LLM Integration](#7-openapi-specification--llm-integration)
- [8. Testing & Quality Assurance](#8-testing--quality-assurance)
- [9. راهنمای فارسی (Persian Documentation)](#9-راهنمای-فارسی-persian-documentation)

---

## 1. Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion, Native Web Components |
| **Backend** | Node.js 22, Express 4.x, TSX, JSZip, Google GenAI SDK (`@google/genai`) |
| **Database** | Client: IndexedDB (`idb`); Server: Atomic JSON Store (`data/editor-db.json`); Cloud: Firebase Firestore |
| **Auth** | Firebase Authentication (Google OAuth, Email/Password, Anonymous/Guest Mode) |
| **AI Engine** | Gemini 3.8 Flash with robust offline deterministic fallback heuristics |
| **Specifications** | OpenAPI 3.1.0, JSON-LD, PWA Manifest & Service Worker, `llms.txt` |
| **Containerization**| Multi-stage Dockerfile (Alpine Linux), Docker Compose |

---

## 2. Quick Start & Local Development

### Prerequisites
- Node.js 20+ (Node 22 recommended)
- npm or bun

### Setup
```bash
# Clone the repository
git clone <repo-url>
cd nononick-editor

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start full-stack development server (Express + Vite HMR)
npm run dev
```

The application will be accessible at:
- Web Studio: `http://localhost:3000/`
- Health check: `http://localhost:3000/api/health`
- OpenAPI Specification: `http://localhost:3000/openapi.json`
- LLM Crawler Guide: `http://localhost:3000/llms.txt`

---

## 3. Deployment Configuration

### Docker & Docker Compose

A production-grade, hardened multi-stage Dockerfile is provided:

```bash
# Build the Docker image
docker build -t nononick-universal-editor:latest .

# Run container standalone
docker run -d -p 3000:3000 \
  -e NODE_ENV=production \
  -e GEMINI_API_KEY="YOUR_KEY" \
  --name nononick-editor \
  nononick-universal-editor:latest

# Or start using Docker Compose with persistent volume
docker-compose up -d
```

### Production Build Script
```bash
# Compile and build client assets
npm run build

# Start production server
npm start
```

---

## 4. Firebase & Firestore Integration

The application integrates with Firebase for Cloud Authentication and Firestore database backups.

### Files
- `firebase.json`: Hosting rewrites, Firestore rule references, and local emulator ports.
- `firestore.rules`: Enterprise-level granular security rules enforcing authentication and per-user ownership.
- `firestore.indexes.json`: Composite query indexes for user projects and version timelines.
- `src/firebase/config.ts`: Client SDK initialization with seamless offline/guest mode fallback.

### Firebase Deployment
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login and initialize project
firebase login
firebase use --add <your-firebase-project-id>

# Deploy security rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy full hosting
firebase deploy --only hosting
```

---

## 5. Backend Architecture & API

The backend is hosted in `server.ts` and acts as a dual-purpose web server and AI proxy.

### Primary Endpoints

#### 1. OpenAI-Compatible Chat Completions
- **POST** `/api/v1/chat/completions`
- Drop-in replacement for OpenAI SDKs, LangChain, LibreChat, and custom bots.
- Body:
  ```json
  {
    "model": "gemini-3.8-flash",
    "messages": [
      { "role": "system", "content": "You are NONONICK AI Assistant." },
      { "role": "user", "content": "Generate a modern SaaS hero section" }
    ],
    "temperature": 0.7
  }
  ```

#### 2. Universal Agent Webhook
- **POST** `/api/agent/prompt`
- Lightweight endpoint for Telegram bots, Discord bots, cURL, Make, or Zapier.

#### 3. Dynamic Mock Database REST API
Every project created in the editor has its own document collections (e.g. `users`, `products`, `orders`).
- `GET /api/mock/:projectId/:collection` (Supports `?search=...`, `?limit=...`, `?sort=...`, `?order=asc|desc`)
- `POST /api/mock/:projectId/:collection` (Inserts record)
- `PUT /api/mock/:projectId/:collection/:id` (Updates record)
- `DELETE /api/mock/:projectId/:collection/:id` (Deletes record)

#### 4. AI Studio Generators
- `POST /api/ai/assistant`: Code editing proposals with side-by-side diffs.
- `POST /api/ai/analyze`: Full-stack code quality and accessibility audit.
- `POST /api/ai/seo-optimize`: Title, description, keywords, OpenGraph, and JSON-LD schema builder.
- `POST /api/ai/code-doctor`: Syntax, accessibility (WCAG AA), and security auto-fix.
- `POST /api/ai/generate-svg`: Vector SVG graphic generator.
- `POST /api/auth/verify`: Firebase ID token decoder and session validator.
- `GET /api/download-app-source-zip`: Instant ZIP download of the complete codebase.

---

## 6. Frontend Architecture

- **Visual Inspector (`ElementInspector.tsx`)**: Click-to-inspect any DOM element, edit typography, margins, padding, Tailwind classes, and direct text.
- **Code Editor (`CodeEditor.tsx`)**: High-performance multi-file editor with syntax awareness and instant hot-reload.
- **Live Preview (`PreviewEngine.tsx`)**: Sandboxed iframe preview with responsive viewport switches (Mobile, Tablet, Desktop) and inline element highlighting.
- **Database Studio (`DatabaseStudio.tsx`)**: Document & schema builder with real-time Mock API generator and seed record generator.
- **SEO Suite (`SeoStudio.tsx`)**: Real-time Google SERP preview, Twitter/Facebook card preview, and sitemap generator.
- **PWA & Offline (`usePWAInstall.ts`, `sw.js`)**: Full Progressive Web App compliance, installable to Desktop and Mobile home screens.

---

## 7. OpenAPI Specification & LLM Integration

The complete OpenAPI 3.1.0 specification is available at:
- `http://localhost:3000/openapi.json`
- File: `/openapi.json` and `/public/openapi.json`

External chatbots and crawlers can also query `http://localhost:3000/llms.txt` for automatic capability discovery.

---

## 8. Testing & Quality Assurance

A dedicated test suite verifies deployment readiness, OpenAPI schemas, database operations, and code cleanliness:

```bash
# Run automated tests
npm test

# Run TypeScript compilation checks
npm run lint

# Verify full production build
npm run build
```

---

## 9. راهنمای فارسی (Persian Documentation)

### معرفی پروژه
پروژه **NONONICK Universal AI Editor** یک استودیوی کامل، مدرن و مستقل برای توسعه وب، ویرایش کد، طراحی بصری (Visual Editor)، ساخت دیتابیس با REST API پویا، سئو و ادغام مدل‌های هوش مصنوعی است.

### ویژگی‌های کلیدی:
1. **کامل و مستقل**: تمامی فایل‌ها بدون نقص، بدون کدهای نیمه‌کاره (TODO) و بدون توابع فرضی پیاده‌سازی شده‌اند.
2. **پشتیبانی از داکر و دیپلوی**: شامل فایل‌های `Dockerfile` چندمرحله‌ای، `docker-compose.yml` و اسکریپت‌های بیلد آماده برای Cloud Run و سرورهای لینوکس.
3. **پیکربندی کامل فایربیس (Firebase)**: شامل احراز هویت (Auth) با گوگل و ایمیل/رمز عبور، قوانین امنیتی پایگاه‌داده فایراستور (`firestore.rules`) و ایندکس‌ها (`firestore.indexes.json`).
4. **بک‌اند حرفه‌ای (Express + Node 22)**:
   - اندپوینت استاندارد سازگار با OpenAI در مسیر `/api/v1/chat/completions` برای اتصال ربات‌های تلگرام، دیسکورد و سیستم‌های چت.
   - وب‌هوک سبک برای Agentها در `/api/agent/prompt`.
   - پایگاه داده موک برای پروژه‌ها با متدهای کامل GET, POST, PUT, DELETE در `/api/mock/:projectId/:collection`.
   - استودیوهای هوش مصنوعی شامل Code Doctor، تولیدکننده کامپوننت Tailwind، سئو هوشمند و تولید وکتور SVG.
5. **مستندات استاندارد OpenAPI**: فایل کامل `openapi.json` برای اتصال فوری به افزونه‌های ChatGPT، Custom GPTs و کلاینت‌های REST.
6. **تست‌های خودکار**: اسکریپت تست کامل با اجرای دستور `npm test` سلامت APIها، ساختار فایل‌ها و بیلد را به صورت ۱۰۰٪ بررسی و تایید می‌کند.

### نحوه اجرا و استقرار:
```bash
# نصب وابستگی‌ها
npm install

# اجرای تست‌ها
npm test

# اجرای پروژه در محیط توسعه
npm run dev

# ساخت و اجرای نسخه پروداکشن
npm run build
npm start
```
