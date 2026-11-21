# YANTRA — Creative AI Studio
### GenAI Meets Human Brain

**Project Status:** Active Development  
**Current Development Milestone:** Approximately 50%  
**Project Type:** AI-Powered Creative Studio  
**Frontend:** HTML5, CSS3, JavaScript, Vite  
**Backend:** Python, FastAPI  
**AI Integration:** Google Gemini Image, Cloudflare FLUX, FLUX fallback

---

## 1. Project Overview

YANTRA is an AI-powered creative platform designed to combine human imagination with generative artificial intelligence.

The main idea behind YANTRA is **"GenAI Meets Human Brain"** — allowing users to transform their creativity, ideas, prompts and visual concepts into digital artwork.

Instead of being just another AI image generator, YANTRA aims to provide an interactive creative environment where users can create, customize, generate, manage and explore digital artwork.

The platform is being developed as a unified AI Creative Studio with multiple creative workspaces, an animated user interface and AI-powered generation capabilities.

## 2. Current Development Progress

The project has reached approximately the 50% development milestone.

The current codebase already contains the main frontend structure, multiple creative workspaces, interactive components, image-generation integration and an initial backend architecture.

However, having the code implemented does not mean every feature is fully tested or production-ready.

The remaining development phase will focus on completing the user experience, connecting and stabilizing services, improving functionality, integrating account management and conducting proper testing.

---

## 3. Features Implemented So Far

### A. Frontend & User Interface

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

### B. Pattern Studio

An interactive workspace for creating geometric and sacred-geometry-inspired patterns.

**Implemented features:**

- Real-time canvas-based pattern generation.
- Adjustable pattern layers.
- Rotation control.
- Symmetry control.
- Scale adjustment.
- Animation speed control.
- Animation on/off toggle.
- Multiple colour themes.
- Custom colour selection.
- Preset patterns:
  - Mandala
  - Flower
  - Geometric
  - Spiral
  - Kaleidoscope
- Random pattern generation.
- Undo and redo.
- Reset functionality.
- Live pattern preview.
- Pattern information panel.
- High-resolution PNG export (2048px).
- Save to gallery.
- Share functionality.
- Automatic saving of pattern settings.

### C. Prompt to Image Studio

The main AI image-generation workspace.

**Implemented features:**

- Text prompt editor.
- Prompt character counter (500 characters).
- Random prompt suggestions.
- Predefined prompt ideas.
- Multiple visual style selections:
  - Watercolor
  - Neon Cyberpunk
  - Anime
  - Oil Painting
  - Pencil Drawing
  - 3D Render
  - Sacred Geometry
  - Surreal
- Reference image upload.
- Drag-and-drop image upload.
- Reference influence control.
- Advanced settings section.
- Negative prompt.
- Aspect ratio selection.
- Resolution selection.
- Backend request preview.
- Animated generation interface.
- Loading and generation status.
- Image result preview.
- Regenerate functionality.
- Download generated images.
- Use generated image as reference.
- Copy prompt.
- Full-size image preview.
- Save generated images to gallery.
- Generation history.
- Delete individual history items.
- Clear generation history.

### D. Sketch to Image Workspace

A separate sketch-based creative workspace is also present in the current project files.

**Implemented features:**

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

### E. Dashboard & Gallery

The dashboard provides a central place to access creative workspaces.

**Implemented features:**

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

### F. Backend Architecture

An initial FastAPI backend has been implemented.

**Implemented components:**

- FastAPI application.
- Health-check endpoint.
- Image-generation endpoint.
- Multipart form-data processing.
- Prompt validation.
- Style validation.
- Negative prompt validation.
- Aspect ratio validation.
- Resolution validation.
- Sketch influence validation.
- Reference image upload handling.
- PNG, JPEG and WebP magic-byte verification.
- 15 MB reference image upload limit.
- Custom security middleware.
- Content Security Policy headers.
- Security response headers.
- Sliding-window IP-based rate limiting.
- Generation mode validation.
- Binary PNG image response.

### G. AI Engine Integration

The backend contains an initial multi-provider image-generation pipeline.

**Current architecture:**

1. Google Gemini Image — primary Prompt-to-Image provider.
2. Cloudflare FLUX.2 Klein — Sketch-to-Image provider.
3. FLUX through Pollinations — Prompt-to-Image fallback.
4. Offline fallback response if generation providers fail.

The backend also supports:

- Prompt-based generation.
- Sketch-based generation.
- Visual style processing.
- Negative prompt processing.
- Aspect ratio handling.
- Resolution handling.
- Reference image processing.

### H. Local Data Storage

Browser-based storage functionality has been implemented.

- Save creative works using localStorage.
- Store generated image history.
- Save pattern settings.
- Retrieve saved works.
- Remove saved works.
- Clear generation history.
- Store reduced-size image previews.

**Note:** Current gallery and history data are browser-local. Cloud synchronization and user-account-based storage have not yet been implemented.

---

## 4. Current Project Architecture

```text
YANTRA/
│
├── frontend/
│   ├── loading.html
│   ├── landing.html
│   ├── dashboard.html
│   ├── index.html
│   ├── prompt-to-image.html
│   └── sketch-to-image.html
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
│   └── requirements.txt
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

---

## 5. Remaining Development Tasks

The following work is planned for the next development phase.

| No. | Pending Task | Description | Priority |
|---|---|---|---|
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

---

## 6. Major Features Planned for the Next Phase

### A. Complete Authentication System

A complete authentication experience will be introduced.

Planned functionality:

- Login page.
- Signup page.
- Logout functionality.
- Password visibility toggle.
- Form validation.
- Secure session management.
- User profile.
- Account settings.
- Personalized user dashboard.

### B. Improved UI/UX

The next phase will focus heavily on making YANTRA feel like a polished AI creative product.

Planned improvements:

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

### C. Complete AI Integration

- Complete API connection testing.
- Improve image-generation reliability.
- Improve prompt interpretation.
- Optimize reference image processing.
- Improve generation feedback.
- Test different styles and resolutions.
- Improve error recovery.
- Ensure all frontend controls work with the actual backend.

### D. User Gallery & Cloud Storage

- User-specific gallery.
- Persistent cloud storage.
- Saved generation history.
- User-owned projects.
- Image management.
- Delete and organize generated works.
- Access saved work from different devices.

### E. Final Testing & Deployment

- Frontend testing.
- Backend testing.
- API integration testing.
- Security review.
- Performance optimization.
- Mobile and desktop testing.
- Production deployment.
- Final bug fixing.

---

## 7. Current Technology Stack

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
| Browser localStorage | Local gallery and history |
| Pillow | Image processing |
| HTTPX | External AI provider requests |

---

## 8. Project Development Roadmap

| Phase | Development Focus | Status |
|---|---|---|
| Phase 1 | Project foundation and frontend architecture | Completed |
| Phase 2 | Landing page, loading screen and dashboard | Implemented |
| Phase 3 | Pattern Studio | Implemented |
| Phase 4 | Prompt to Image workspace | Implemented |
| Phase 5 | Sketch to Image workspace | Implemented |
| Phase 6 | Initial backend and AI engine architecture | Implemented |
| Phase 7 | Complete API integration and testing | In Progress |
| Phase 8 | Login, signup and authentication | Pending |
| Phase 9 | Database and cloud storage | Pending |
| Phase 10 | Advanced UI/UX and feature improvements | Pending |
| Phase 11 | Full application testing and security review | Pending |
| Phase 12 | Production deployment | Pending |

---

## 9. Development Setup

### Frontend

Requirements:
- Node.js
- npm

Installation:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

### Backend

Requirements:
- Python 3.10+
- pip

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

Configure backend environment variables using `backend/.env.example`.

Start backend:

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

Frontend API configuration:

```env
VITE_YANTRA_GENERATE_URL=http://127.0.0.1:8000/api/v1/generate
```

Restart Vite after changing environment variables.

---

## 10. Important Development Notes

- The project currently uses Vanilla JavaScript and Vite.
- No React or Framer Motion dependency is currently used.
- Frontend image-generation requests are centralized in `src/js/api/aiClient.js`.
- The backend accepts multipart/form-data requests.
- Prompt-to-Image and Sketch-to-Image use separate generation modes.
- Gallery and history are currently browser-local.
- The existing backend is an initial implementation, not a completed production service.
- Login, signup, database-backed accounts and cloud gallery are not yet implemented.
- The project still requires full functional and integration testing.
- API keys and private credentials must remain on the backend and must never be committed to a public repository.

---

## 11. Final Project Vision

YANTRA aims to become a complete AI-powered creative ecosystem where human imagination and artificial intelligence work together.

The final platform will combine:

- AI-powered image generation.
- Sketch-based image transformation.
- Interactive geometric pattern creation.
- Personalized creative workspaces.
- User accounts and cloud galleries.
- Advanced creative controls.
- A polished, animated and responsive interface.

Our goal is not simply to build an image-generation website. We aim to create an interactive creative studio that makes AI-powered creativity more accessible, intuitive and engaging.

**YANTRA — Where Human Imagination Meets Generative AI.**

---

*Development is ongoing. Features listed as implemented represent functionality found in the current project codebase; production readiness and complete end-to-end functionality are still subject to testing.*
