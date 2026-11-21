<div align="center">

# YANTRA — Creative AI Studio

**GenAI Meets Human Brain**

An AI-powered creative studio where ideas, prompts, sketches and geometry become digital artwork.

![Status](https://img.shields.io/badge/status-active%20development-blue)
![Milestone](https://img.shields.io/badge/milestone-~50%25-orange)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?logo=googlegemini&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare%20FLUX-F38020?logo=cloudflare&logoColor=white)

</div>

---

> **Project status: active development (~50% milestone).**
> The features listed as implemented exist in the current codebase, but that does not mean every feature is fully tested or production-ready. Accounts, database storage and cloud gallery are **not yet implemented**, and the backend is an initial implementation rather than a completed production service.

## Table of Contents

- [Overview](#overview)
- [At a Glance](#at-a-glance)
- [Features Implemented So Far](#features-implemented-so-far)
- [AI Engine](#ai-engine)
- [Backend & Security](#backend--security)
- [Local Data Storage](#local-data-storage)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development Roadmap](#development-roadmap)
- [Remaining Development Tasks](#remaining-development-tasks)
- [Planned for the Next Phase](#planned-for-the-next-phase)
- [Development Notes](#development-notes)
- [Vision](#vision)

---

## Overview

YANTRA is an AI-powered creative platform that combines human imagination with generative artificial intelligence. The core idea is **"GenAI Meets Human Brain"**: users turn their creativity, ideas, prompts and visual concepts into digital artwork.

Rather than being just another AI image generator, YANTRA aims to be an interactive creative environment where users can **create, customize, generate, manage and explore** digital artwork. It is being built as a unified AI Creative Studio with multiple creative workspaces, an animated interface and AI-powered generation.

### Workspaces

| Workspace | Purpose |
|---|---|
| **Pattern Studio** | Real-time, canvas-based geometric and sacred-geometry-inspired pattern creation |
| **Prompt to Image Studio** | The main AI image-generation workspace |
| **Sketch to Image** | Draw or upload a sketch and transform it with AI |
| **Dashboard & Gallery** | Central hub for workspaces and saved work |

## At a Glance

| | |
|---|---|
| **Project type** | AI-powered creative studio |
| **Status** | Active development, approximately 50% of the planned milestone |
| **Frontend** | HTML5, CSS3, JavaScript (vanilla), Vite |
| **Backend** | Python, FastAPI |
| **AI integration** | Google Gemini Image, Cloudflare FLUX.2 Klein, Pollinations FLUX fallback |
| **Persistence** | Browser `localStorage` only (no accounts or cloud sync yet) |

## Features Implemented So Far

The current codebase already contains the main frontend structure, multiple creative workspaces, interactive components, image-generation integration and an initial backend architecture. Expand a section below for details.

<details>
<summary><b>A. Frontend & User Interface</b></summary>

<br>

- Multi-page website architecture using Vite.
- Animated loading and introduction screen.
- Landing page with hero section and feature presentation.
- Interactive dashboard.
- Responsive page layouts and reusable interface components.
- Glassmorphism-inspired visual design.
- Gradient effects, animated backgrounds and visual elements.
- CSS and JavaScript-based animations.
- Interactive navigation and reusable UI components.
- Reduced-motion accessibility support.

</details>

<details>
<summary><b>B. Pattern Studio</b></summary>

<br>

An interactive workspace for creating geometric and sacred-geometry-inspired patterns.

- Real-time canvas-based pattern generation.
- Adjustable pattern layers.
- Rotation control.
- Symmetry control.
- Scale adjustment.
- Animation speed control.
- Animation on/off toggle.
- Multiple colour themes.
- Custom colour selection.
- Preset patterns: **Mandala**, **Flower**, **Geometric**, **Spiral**, **Kaleidoscope**.
- Random pattern generation.
- Undo and redo.
- Reset functionality.
- Live pattern preview.
- Pattern information panel.
- High-resolution PNG export (2048px).
- Save to gallery.
- Share functionality.
- Automatic saving of pattern settings.

</details>

<details>
<summary><b>C. Prompt to Image Studio</b></summary>

<br>

The main AI image-generation workspace.

**Prompting**

- Text prompt editor.
- Prompt character counter (500 characters).
- Random prompt suggestions.
- Predefined prompt ideas.

**Visual styles**

Watercolor, Neon Cyberpunk, Anime, Oil Painting, Pencil Drawing, 3D Render, Sacred Geometry, Surreal.

**Reference image & advanced settings**

- Reference image upload.
- Drag-and-drop image upload.
- Reference influence control.
- Advanced settings section.
- Negative prompt.
- Aspect ratio selection.
- Resolution selection.
- Backend request preview.

**Generation experience**

- Animated generation interface.
- Loading and generation status.
- Image result preview.
- Regenerate functionality.

**Results & history**

- Download generated images.
- Use generated image as reference.
- Copy prompt.
- Full-size image preview.
- Save generated images to gallery.
- Generation history.
- Delete individual history items.
- Clear generation history.

</details>

<details>
<summary><b>D. Sketch to Image Workspace</b></summary>

<br>

A separate sketch-based creative workspace is present in the current project files.

- HTML5 canvas drawing.
- Brush tool.
- Eraser tool.
- Brush size adjustment.
- Custom drawing colour.
- Quick colour selection.
- Undo and redo.
- Clear canvas.
- Upload reference image.
- Drag-and-drop image upload.
- Prompt input.
- Style selection.
- Sketch influence adjustment.
- Sketch PNG export.
- Send flattened sketch/reference image to the backend.
- AI-generated result preview.
- Download generated result.
- Save generated result to gallery.

</details>

<details>
<summary><b>E. Dashboard & Gallery</b></summary>

<br>

The dashboard provides a central place to access creative workspaces.

- Welcome section.
- Workspace shortcuts.
- Saved work statistics.
- Image and pattern counts.
- Backend connection status indicator.
- Recent works gallery.
- Saved image preview.
- Saved pattern preview.
- Download saved works.
- Remove saved works.

</details>

## AI Engine

The backend contains an initial multi-provider image-generation pipeline:

| Order | Provider | Role |
|:---:|---|---|
| 1 | **Google Gemini Image** | Primary Prompt-to-Image provider |
| 2 | **Cloudflare FLUX.2 Klein** | Sketch-to-Image provider |
| 3 | **FLUX through Pollinations** | Prompt-to-Image fallback |
| 4 | **Offline fallback response** | Returned if generation providers fail |

The backend also supports:

- Prompt-based generation.
- Sketch-based generation.
- Visual style processing.
- Negative prompt processing.
- Aspect ratio handling.
- Resolution handling.
- Reference image processing.

> **Note:** Prompt-to-Image and Sketch-to-Image use separate generation modes. Gemini and Cloudflare generation and fallback handling still require stability testing (see [Remaining Development Tasks](#remaining-development-tasks)).

## Backend & Security

An initial FastAPI backend has been implemented.

### API

| Endpoint | Description |
|---|---|
| `GET /api/v1/health` | Health check (`http://127.0.0.1:8000/api/v1/health` locally) |
| `POST /api/v1/generate` | Image generation. Accepts `multipart/form-data`, returns a binary PNG image |

### Request validation

- Prompt validation.
- Style validation.
- Negative prompt validation.
- Aspect ratio validation.
- Resolution validation.
- Sketch influence validation.
- Generation mode validation.

### Upload handling & security

| Area | Implementation |
|---|---|
| Reference uploads | Reference image upload handling with **PNG, JPEG and WebP magic-byte verification** |
| Upload size | **15 MB** reference image limit |
| Middleware | Custom security middleware |
| Headers | Content Security Policy (CSP) headers and additional security response headers |
| Rate limiting | Sliding-window, IP-based rate limiting |

> **Security reminder:** API keys and private credentials must remain on the backend and must never be committed to a public repository.

## Local Data Storage

Browser-based storage is implemented with `localStorage`:

- Save creative works.
- Store generated image history.
- Save pattern settings.
- Retrieve saved works.
- Remove saved works.
- Clear generation history.
- Store reduced-size image previews.

> **Limitation:** Gallery and history data are currently **browser-local**. Cloud synchronization and user-account-based storage have not yet been implemented.

## Project Structure

```text
YANTRA/
│
├── loading.html
├── landing.html
├── dashboard.html
├── index.html
├── prompt-to-image.html
├── sketch-to-image.html
│
├── src/
│   ├── css/
│   │   ├── base.css
│   │   ├── landing.css
│   │   ├── dashboard.css
│   │   ├── studio.css
│   │   └── prompt.css
│   │
│   └── js/
│       ├── api/
│       ├── core/
│       ├── pages/
│       └── pattern/
│
├── backend/
│   ├── main.py
│   ├── ai_engine.py
│   ├── security.py
│   ├── requirements.txt
│   └── .env.example
│
├── docs/
│   └── BACKEND_INTEGRATION.md
│
├── public/
├── legacy/
├── package.json
├── vite.config.mjs
└── README.md
```

## Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling and animations |
| JavaScript | Frontend functionality |
| Vite | Development server and build tool |
| Python | Backend programming |
| FastAPI | Backend API framework |
| Google Gemini Image | AI image generation |
| Cloudflare FLUX.2 Klein | Sketch-to-image generation |
| Pollinations FLUX | Image-generation fallback |
| HTML5 Canvas | Pattern generation and drawing |
| Browser `localStorage` | Local gallery and history |
| Pillow | Image processing |
| HTTPX | External AI provider requests |

## Getting Started

### Frontend

**Requirements:** Node.js, npm

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Create a production build
npm run build
```

### Backend

**Requirements:** Python 3.10+, pip

```bash
# Install dependencies
pip install -r backend/requirements.txt
```

Configure backend environment variables using `backend/.env.example`, then start the backend:

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Backend health endpoint:

```text
http://127.0.0.1:8000/api/v1/health
```

Image-generation endpoint:

```text
POST /api/v1/generate
```

### Connecting the frontend to the backend

Set the generation URL in the frontend environment configuration:

```env
VITE_YANTRA_GENERATE_URL=http://127.0.0.1:8000/api/v1/generate
```

> Restart Vite after changing environment variables.

For more detail, see [`docs/BACKEND_INTEGRATION.md`](docs/BACKEND_INTEGRATION.md).

## Development Roadmap

| Phase | Development Focus | Status |
|:---:|---|---|
| 1 | Project foundation and frontend architecture | Completed |
| 2 | Landing page, loading screen and dashboard | Implemented |
| 3 | Pattern Studio | Implemented |
| 4 | Prompt to Image workspace | Implemented |
| 5 | Sketch to Image workspace | Implemented |
| 6 | Initial backend and AI engine architecture | Implemented |
| 7 | Complete API integration and testing | In Progress |
| 8 | Login, signup and authentication | Pending |
| 9 | Database and cloud storage | Pending |
| 10 | Advanced UI/UX and feature improvements | Pending |
| 11 | Full application testing and security review | Pending |
| 12 | Production deployment | Pending |

## Remaining Development Tasks

The following work is planned for the next development phase.

| No. | Pending Task | Description | Priority |
|:---:|---|---|:---:|
| 1 | Login & Signup | Build proper registration, login and logout pages | High |
| 2 | Authentication | Implement secure user authentication and session management | High |
| 3 | User Profiles | Profile page, account settings and user information | High |
| 4 | Database Integration | Store user accounts, generated works and application data | High |
| 5 | Cloud Gallery | Enable users to access saved works across devices | High |
| 6 | Backend Integration | Complete frontend-backend connection and API testing | High |
| 7 | AI API Stability | Test Gemini and Cloudflare generation and fallback handling | High |
| 8 | Prompt Optimization | Improve prompt processing and generation quality | High |
| 9 | UI/UX Enhancement | Improve layouts, interactions, responsiveness and consistency | High |
| 10 | Advanced Animations | Add smoother transitions, micro-interactions and visual effects | Medium |
| 11 | Dashboard Upgrade | Add personalized dashboard and user activity information | Medium |
| 12 | Gallery Enhancement | Add search, filtering, sorting and better gallery management | Medium |
| 13 | Sketch Studio Improvements | Improve drawing experience and sketch-to-image workflow | Medium |
| 14 | Pattern Studio Improvements | Add more customization and creative pattern options | Medium |
| 15 | Error Handling | Improve API errors, loading states and user feedback | High |
| 16 | Security Improvements | Review authentication, API protection, uploads and rate limiting | High |
| 17 | Mobile Responsiveness | Optimize all pages for mobile, tablet and desktop | High |
| 18 | Testing & Debugging | Perform functional, integration and cross-browser testing | High |
| 19 | Deployment | Configure production frontend and backend hosting | High |
| 20 | Final Optimization | Performance, accessibility and production readiness | Medium |

## Planned for the Next Phase

<details>
<summary><b>A. Complete Authentication System</b></summary>

<br>

- Login page.
- Signup page.
- Logout functionality.
- Password visibility toggle.
- Form validation.
- Secure session management.
- User profile.
- Account settings.
- Personalized user dashboard.

</details>

<details>
<summary><b>B. Improved UI/UX</b></summary>

<br>

The next phase will focus heavily on making YANTRA feel like a polished AI creative product.

- More creative and modern interface.
- Better visual hierarchy.
- Smooth page transitions.
- Improved navigation.
- Better responsive layouts.
- Interactive cards and components.
- More polished loading animations.
- Improved empty states.
- Better notifications and error messages.
- Consistent design across all workspaces.

</details>

<details>
<summary><b>C. Complete AI Integration</b></summary>

<br>

- Complete API connection testing.
- Improve image-generation reliability.
- Improve prompt interpretation.
- Optimize reference image processing.
- Improve generation feedback.
- Test different styles and resolutions.
- Improve error recovery.
- Ensure all frontend controls work with the actual backend.

</details>

<details>
<summary><b>D. User Gallery & Cloud Storage</b></summary>

<br>

- User-specific gallery.
- Persistent cloud storage.
- Saved generation history.
- User-owned projects.
- Image management.
- Delete and organize generated works.
- Access saved work from different devices.

</details>

<details>
<summary><b>E. Final Testing & Deployment</b></summary>

<br>

- Frontend testing.
- Backend testing.
- API integration testing.
- Security review.
- Performance optimization.
- Mobile and desktop testing.
- Production deployment.
- Final bug fixing.

</details>

## Development Notes

- The project currently uses **Vanilla JavaScript and Vite**. No React or Framer Motion dependency is used.
- Frontend image-generation requests are centralized in `src/js/api/aiClient.js`.
- The backend accepts `multipart/form-data` requests.
- Prompt-to-Image and Sketch-to-Image use separate generation modes.
- Gallery and history are currently browser-local.
- The existing backend is an initial implementation, not a completed production service.
- Login, signup, database-backed accounts and cloud gallery are not yet implemented.
- The project still requires full functional and integration testing.
- API keys and private credentials must remain on the backend and must never be committed to a public repository.

## Vision

YANTRA aims to become a complete AI-powered creative ecosystem where human imagination and artificial intelligence work together. The final platform will combine:

- AI-powered image generation.
- Sketch-based image transformation.
- Interactive geometric pattern creation.
- Personalized creative workspaces.
- User accounts and cloud galleries.
- Advanced creative controls.
- A polished, animated and responsive interface.

The goal is not simply to build an image-generation website, but an interactive creative studio that makes AI-powered creativity more accessible, intuitive and engaging.

<div align="center">

**YANTRA — Where Human Imagination Meets Generative AI.**

</div>

---

*Development is ongoing. Features listed as implemented represent functionality found in the current project codebase; production readiness and complete end-to-end functionality are still subject to testing.*
