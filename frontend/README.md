# AI-Powered Library & Research Assistant — Frontend

Frontend application built with **React 19 + TypeScript + Vite + Tailwind CSS** for the AI-Powered Library & Research Assistant.

## Features

- **Book Catalog**: Browse, search (with debounced query), and view book details including stock and embedding status badges.
- **Admin Book Management**: Add new books or edit existing records (`POST /admin/books`, `PATCH /admin/books/{id}`), reporting real-time embedding indexing status (`pending`, `ready`, `failed`).
- **Semantic Recommendations**: Query natural-language suggestions (`POST /api/v1/recommendations`). Categorized into:
  - 🟢 **Available in Library** (`in_library_available`)
  - 🟡 **In Library — Out of Stock** (`in_library_out_of_stock`)
  - ⚪ **External Suggestions** (`not_in_library` — AI-generated suggestions, explicitly labelled as not owned by the library)
- **FAQ Assistant**: Interactive chat interface (`POST /api/v1/chat/faq`) with support for bounded 1-retry fallback and configured support contact display (`support_contact`).
- **Research Paper Search**: Google Scholar scholarly search (`POST /api/v1/research/search`) displaying title, author list, publication year, snippet, DOI, and external paper links.
- **My Loans**: User borrowing history and due-date tracking (`GET /api/v1/loans/me`), overdue warnings, and book return action (`POST /api/v1/loans/{id}/return`).
- **Admin Analytics Dashboard**: Date-range filtered purchase metrics, AI-generated analytical narrative, and interactive charts (Bar, Line, Pie via Recharts) validating backend chart data.
- **Authentication**: JWT authentication with role-based route protection (`user` vs `admin`).
- **Contract-Compliant Mock Mode**: Seamless offline development using `VITE_USE_MOCK=true` when the backend is not yet running.

## Getting Started

### 1. Installation

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Variables:
- `VITE_API_BASE_URL`: Base URL for the FastAPI backend (e.g. `http://localhost:8000/api/v1`).
- `VITE_USE_MOCK`: Set to `true` to run against contract-shaped mock data without a running backend.

### 3. Development Server

```bash
npm run dev
```

Runs on [http://localhost:5173](http://localhost:5173).

### 4. Production Build & Verification

```bash
npm run build
npm run lint
```
