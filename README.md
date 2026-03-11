# 🎵 Album Progress Tracker

**Album Progress Tracker** is a professional web application designed for musicians, producers, and engineers to manage the lifecycle of an album's production. From the first recording session to the final master, track every detail of your creative process in real-time.

---

## 🚀 Key Capabilities

- **Phase-Based Tracking**: Manage songs through four distinct production stages: Recording, Editing, Mixing, and Mastering.
- **Instrument Checklist**: Independent progress tracking for 26+ instruments across production phases.
- **Collaborative Workspace**: Invite collaborators to join your projects and work together in real-time.
- **Integrated Resources**: attachment of audio/image files, notes, subtasks, and external links directly to specific production phases.
- **Real-time Synchronization**: Powered by Cloud Firestore for instant updates across all members.
- **File Management**: Securely upload and manage session files and reference tracks.

---

## 🛠 Tech Stack

| Component                   | Technology                              |
| --------------------------- | --------------------------------------- |
| **Frontend**                | React 19 + Vite 7                       |
| **Runtime/Package Manager** | Bun                                     |
| **Authentication**          | Firebase Auth (Google & Email/Password) |
| **Database**                | Cloud Firestore (Real-time)             |
| **Storage**                 | Firebase Storage                        |
| **Styling**                 | React Bootstrap 2.10                    |
| **Testing**                 | Vitest + Testing Library                |

---

## ⚙️ Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your system.
- A Firebase project set up.

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd album-tracker
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your Firebase credentials:
   ```bash
   cp .env.example .env
   ```

---

## 💻 Available Scripts

| Command              | Action                                        |
| -------------------- | --------------------------------------------- |
| `bun run dev`        | Starts the development server with Vite.      |
| `bun run build`      | Builds the application for production.        |
| `bun run lint`       | Runs ESLint to check for code quality issues. |
| `bun run test`       | Executes all unit and component tests.        |
| `bun run test:watch` | Runs Vitest in watch mode.                    |
| `bun run preview`    | Previews the production build locally.        |

---

## 📁 Project Structure

- `src/components`: Reusable UI components.
- `src/context`: Authentication and Theme providers.
- `src/hooks`: Custom hooks for Firestore CRUD and state.
- `src/pages`: Main view routes.
- `src/utils`: Formatting logic and validators.
- `src/__tests__`: Comprehensive test suite.

---

_Made with ❤️ for the music industry._
