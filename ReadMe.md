# Elora.AI

Elora.AI is a next-generation, full-stack AI assistant platform designed for seamless multimedia interaction, advanced analytics, and professional editing capabilities. It delivers a clean, branded experience with no visible model names, making it ideal for both personal use and enterprise deployment. Elora.AI combines modern UI/UX, robust backend architecture, and integration with multiple leading AI providers to offer features far beyond standard chatbots.

---

## Table of Contents
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
  - [Frontend](#frontend-architecture)
  - [Backend](#backend-architecture)
  - [Data Storage](#data-storage)
  - [Authentication & Authorization](#authentication--authorization)
  - [File Processing & Upload](#file-processing--upload)
- [External Dependencies](#external-dependencies)
- [Advanced Editing Capabilities](#advanced-editing-capabilities)
  - [Image Editor](#image-editor-features)
  - [Video Editor](#video-editor-features)
  - [Data Analytics](#data-analytics-features)
  - [Graph Generator](#graph-generator-features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the App](#running-the-app)
- [Usage Guide](#usage-guide)
- [Contributing](#contributing)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [License](#license)
- [Authors](#authors)

---

## Key Features

- **Multimedia AI Platform:**  
  Generate and edit images, videos, and audio. Supports text-to-speech and voice input.
- **File Processing:**  
  Extract and analyze content from PDFs, Word, images, videos, code files, CSV, JSON, Excel, and more.
- **Advanced Editors:**  
  Professional-grade image and video editing directly in the browser.
- **Predefined Responses:**  
  50+ instant replies for rapid Q&A and common service tasks.
- **Mathematical Graph Generation:**  
  Create and visualize complex mathematical and network graphs for education and analysis.
- **Smart Response Routing:**  
  Fast, intelligent routing of requests between predefined answers, AI providers, and fallback logic.
- **Data Analytics Suite:**  
  Upload, analyze, and visualize tabular and unstructured data with statistical tools and rich charting.
- **Firebase Authentication:**  
  Secure login with Google or email/password. Managed sessions and user profiles.
- **Clean UI:**  
  Responsive, dark/light modes, animated sidebar, collapsible chat threads, and zero visible AI model branding.
- **Error Handling:**  
  Real-time error overlays, comprehensive validation, and robust API integrations.
- **Cloud-Ready:**  
  Serverless PostgreSQL (Neon), scalable Express backend, abstracted storage layer.

---

## System Architecture

### Frontend Architecture

- **React 18 + TypeScript:** Modern, type-safe SPA.
- **Styling:** Tailwind CSS, custom variables, dark/light themes.
- **UI:** Radix UI + shadcn/ui for accessible, consistent components.
- **State Management:** TanStack Query (React Query) for API state, local and remote caching.
- **Routing:** Wouter for fast, minimal client-side navigation.
- **Build System:** Vite for rapid dev and optimized builds.
- **Auth:** React Firebase Hooks for easy authentication state tracking.
- **Features:** Component-based design, file upload, voice input, animated sidebar, responsive layout.

### Backend Architecture

- **Express.js + TypeScript:** Modular REST API server.
- **Database:** PostgreSQL (Neon cloud) via Drizzle ORM for type-safe queries and migrations.
- **Auth:** Firebase Authentication for user management; custom profile linking.
- **File Processing:**  
  - PDFs: pdf-parse
  - DOCX: mammoth
  - Images: sharp
  - Videos: FFmpeg
  - Tabular: Custom analytics engine
- **AI Integration:** Multiple providers (Google Gemini, OpenRouter, etc.), each with dedicated client modules.
- **Storage:** Abstracted layer (in-memory for dev, DB for prod).
- **Editing:** Real-time image/video editing with advanced features.
- **Analytics:** pandas-like analysis, statistical calculations, charting.
- **Graph Generation:** Complex network/graph algorithms, visualizations.

### Data Storage

- **Database:**  
  - Persistent: PostgreSQL (Neon Database for cloud deployment)
  - Dev: In-memory storage
- **ORM:** Drizzle ORM for schema definition and migrations.
- **Tables:** Users, chat threads, messages, API keys.

### Authentication & Authorization

- **Provider:** Firebase Authentication (Google, email/password)
- **Security:** Token/session management via Firebase
- **User Management:** Custom app profiles linked to Firebase UID

### File Processing & Upload

- **Supported Formats:** Text, PDF, DOCX, images, videos, CSV, JSON, Excel
- **Upload Handling:** Multer middleware (50MB limit), temp storage, auto-cleanup
- **Content Extraction:** Dedicated file processor for text and metadata
- **Editing:** Direct manipulation and enhancement in browser

---

## External Dependencies

### AI Services
- **Google Gemini:** Advanced models for language, image, and video via @google/genai SDK.
- **OpenRouter:** Access to Claude 3.5 Sonnet, GPT-4o, and more.
- **Model Support:** Dynamic routing and fallback across multiple models.

### Authentication Services
- **Firebase Authentication:** Secure login, session, and user data management.
- **Firebase Firestore:** Profile and metadata storage.

### Database Services
- **Neon Database:** Serverless, scalable PostgreSQL.
- **Pooling:** Built-in connection management for concurrency.

### Development / Deployment
- **Replit Integration:** Custom Vite plugins for cloud/dev environments.
- **Error Handling:** Dev overlays, runtime crash reporting.
- **Build:** ESBuild (server), Vite (client).

### UI & Styling
- **Tailwind CSS:** Utility-first, custom theme config.
- **Radix UI:** Accessible primitives.
- **Framer Motion:** Interactive, smooth animations.
- **React Hook Form + Zod:** Validated, type-safe forms.

### File Processing Libraries
- **PDF Parsing:** pdf-parse
- **Word Docs:** mammoth
- **Image Editing:** sharp
- **Video Processing:** FFmpeg
- **Data Analytics:** Custom engine inspired by pandas
- **Graph Algorithms:** Network analysis, visualization
- **Text-to-Speech:** Web Speech API

---

## Advanced Editing Capabilities

### Image Editor Features

- **Adjustments:** Brightness, contrast, saturation, hue, warmth, tint, highlights, shadows, whites, blacks, sharpen, denoise, vignette
- **Effects:** Dynamic, enhance, warm/cool, ultra HDR, blur, unblur, magic eraser
- **Filters:** Vivid, playa, honey, isla, desert, clay, palma, modena, metro, west, ollie, onyx, eiffel, vogue, vista
- **Cropping:** Crop, flip horizontal/vertical, expand canvas
- **Markup:** Pen, highlighter, text annotation (color, size)
- **Background Removal:** AI-powered

### Video Editor Features

- **Effects/Filters:** Brightness, contrast, saturation, hue, blur, sharpen, color correction, stabilization
- **Style Filters:** Vintage, cinematic, warm/cool, dramatic, softening, clarity
- **Audio:** Volume, fade in/out, background music, voice enhancement, noise reduction
- **Transitions:** Fade, crossfade, dissolve, slide, zoom, spin
- **Editing Tools:** Trim, merge, subtitles, extract audio, thumbnails
- **Export:** Multiple formats, quality control

### Data Analytics Features

- **Sources:** CSV, JSON, Excel, PDF, DOCX, API endpoints
- **Analysis Types:** Descriptive stats, correlation, clustering, time series, text analysis, comparative
- **Visualizations:** Line, bar, scatter, heatmap, pie, histogram, box, violin, word cloud, treemap, sunburst, 3D
- **Statistical Tools:** Regression, ANOVA, outlier detection, trend analysis
- **Export:** JSON, CSV, PDF

### Graph Generator Features

- **Graph Types:** Random, scale-free, small-world, hierarchical, community
- **Layouts:** Force-directed, circular, grid, hierarchical, spring, Kamada-Kawai, spectral, random
- **Analysis:** Centrality (betweenness, closeness, degree, eigenvector, PageRank), clustering coefficient, community detection, connectivity analysis
- **Visualization:** Interactive canvas, customizable colors/styles/animations
- **Export:** JSON, GEXF

---

## Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Yarn** or **npm**
- **PostgreSQL** (local or Neon cloud)
- **Firebase Project** (for Auth)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sourabhk00/EloraAI.git
   cd EloraAI
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Setup environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in:
     - Firebase credentials
     - GEMINI_API_KEY
     - OPENROUTER_API_KEY
     - DATABASE_URL (PostgreSQL/Neon)

4. **Initialize database:**
   ```bash
   yarn db:migrate
   ```

### Running the App

- **Start Frontend:**
  ```bash
  yarn dev
  # or
  npm run dev
  ```
- **Start Backend:**
  ```bash
  yarn server
  # or
  npm run server
  ```
- **Access:**  
  - Open [http://localhost:3000](http://localhost:3000)

---

## Usage Guide

- **Sign in:** Use Google or email/password via Firebase.
- **Start a Chat:**  
  - Type, speak, or upload a file to begin.
  - Chat threads are managed in the sidebar (collapsible, animated).
- **AI Capabilities:**  
  - Use multimedia inputs (voice, images, video, code).
  - Try instant predefined responses for common queries.
  - Download or share generated content.
- **Editing:**  
  - Open image/video files for advanced editing.
  - Save/export results in multiple formats.
- **Data Analytics:**  
  - Upload CSV/Excel/JSON for instant analysis and charting.
- **Graph Generation:**  
  - Generate mathematical/network graphs, analyze and export.

---

## Contributing

We welcome contributions of all kinds!

1. Fork the repo.
2. Create a branch (`git checkout -b feature/your-feature`).
3. Push commits.
4. Open a pull request describing your changes.

Please use the Issues tab for bug reports or feature requests.

---

## Troubleshooting & FAQ

**Q: API key not working?**  
A: Double-check your environment variables, especially `GEMINI_API_KEY` and `OPENROUTER_API_KEY`.

**Q: Database connection fails?**  
A: Verify your `DATABASE_URL` and ensure Neon/PostgreSQL is running.

**Q: File upload errors?**  
A: Ensure files are <50MB and in supported formats.

**Q: Authentication issues?**  
A: Reconfigure Firebase settings; check Auth tab in Firebase console.

**Q: Need help?**  
A: Open a GitHub issue or email the maintainer.

---

## License

Elora.AI is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Authors

- [Sourabh K](https://github.com/sourabhk00)

For questions or custom enterprise deployments, contact via GitHub.
