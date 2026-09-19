# 🌐 CodeSphere

> **A Cloud-Native Real-Time Project Collaboration and Resource Management Platform**

CodeSphere is a high-performance collaboration platform built for software teams, student developers, hackathons, and agile squads. It combines real-time communication, task management, cloud file sharing, documentation hubs, and project health monitoring into an intuitive obsidian-and-indigo glassmorphism web experience.

---

## 🚀 Key Features

* 🔐 **Authentication & Security** — JWT authentication, bcrypt password encryption (12 rounds), role-based access control (`OWNER`, `ADMIN`, `MEMBER`).
* 📊 **Project Health Dashboard** — Real-time analytics, task completion %, member breakdown, and activity audit timeline.
* 📋 **Interactive Kanban Board** — Visual multi-column workflow (`To Do`, `In Progress`, `Review`, `Done`) with real-time status transitions.
* 💬 **Real-Time Team Chat** — Socket.IO room-isolated chat channels with live typing indicators and online member detection.
* ☁️ **AWS S3 Cloud Storage** — Multipart file upload and storage with support for AWS S3 and automated local fallback.
* 📚 **Documentation Hub** — Markdown-based documentation system categorized by Architecture, API, Setup, and Meeting Notes.
* 🔔 **Instant Notifications** — Notification center with unread badges, real-time alerts, and deep-link routing.
* 🐙 **GitHub Integration** — Direct linking to source repositories.

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS with custom glassmorphism design system
- **Routing**: React Router v7
- **Real-Time Client**: Socket.IO Client
- **Icons**: Lucide React
- **HTTP Client**: Axios with JWT interceptors

### Backend
- **Runtime**: Node.js + Express.js
- **Database ORM**: Prisma ORM
- **Database**: PostgreSQL (Amazon RDS ready)
- **Real-Time Engine**: Socket.IO Server
- **Cloud Storage**: AWS S3 SDK (`@aws-sdk/client-s3`) & Multer
- **Security & Headers**: Helmet, CORS, Morgan

---

## 📁 Repository Structure

```
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI & Layout components (Navbar, etc.)
│   │   ├── context/            # AuthContext & state providers
│   │   ├── pages/              # DashboardPage, ProjectDetailPage, LoginPage, RegisterPage
│   │   ├── services/           # Axios API configuration
│   │   ├── App.jsx             # Route definitions & protected route guards
│   │   └── main.jsx            # React root
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Express + Socket.IO Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma PostgreSQL models (User, Project, Task, Message, File, Document)
│   │   ├── seed.js             # Rich seed script with realistic demo projects
│   │   └── migrations/         # PostgreSQL database migrations
│   ├── src/
│   │   ├── config/             # Database connection singleton
│   │   ├── controllers/        # Auth, Project, Task, Message, File, Document, Member, Notification
│   │   ├── middleware/         # Auth, Role guards, Error handling, Multer upload
│   │   ├── routes/             # REST API routes
│   │   ├── services/           # AWS S3 & local storage service layer
│   │   ├── utils/              # JWT, password hashing, standardized response helpers
│   │   ├── app.js              # Express app setup
│   │   └── server.js           # HTTP server + Socket.IO lifecycle
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js (v18+)
- PostgreSQL database instance
- npm or yarn

### 1. Backend Setup
```bash
cd server
npm install

# Configure environment variables
cp .env.example .env
# Update DATABASE_URL with your PostgreSQL connection string

# Run migrations and seed data
npx prisma migrate dev
node prisma/seed.js

# Start backend server
npm run dev
```

### 2. Frontend Setup
```bash
cd ../client
npm install

# Start Vite dev server
npm run dev
```

The application will be accessible at:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

### 3. Demo Credentials
- **Email**: `abhinav@codesphere.in`
- **Password**: `Password123!`

---

## 📡 REST API Summary

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Log in and receive JWT | No |
| `GET` | `/api/projects` | List projects for logged-in user | Yes |
| `POST` | `/api/projects` | Create new project | Yes |
| `GET` | `/api/projects/:id/health` | Compute project health & task analytics | Yes |
| `GET` | `/api/projects/:id/tasks` | Get Kanban tasks for project | Yes |
| `POST` | `/api/projects/:id/tasks` | Create new task | Yes |
| `PATCH`| `/api/projects/tasks/:id` | Update task status / priority / assignee | Yes |
| `GET` | `/api/projects/:id/messages`| Get chat history | Yes |
| `GET` | `/api/projects/:id/files` | List project files (S3 / Cloud storage) | Yes |
| `POST` | `/api/projects/:id/files` | Upload file (Multipart) | Yes |
| `GET` | `/api/projects/:id/documents`| List project documents | Yes |
| `POST` | `/api/projects/:id/documents`| Create markdown documentation | Yes |
| `GET` | `/api/users/me/notifications`| List user notifications | Yes |

---

## 📄 License
This project is licensed under the ISC License.
