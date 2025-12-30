# DevConsole - Task Tracker

[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://opensource.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**DevConsole** is a modern open source task management system with a retro-terminal design for developer teams. The project combines the functionality of a professional task tracker with game elements and a unique visual style in the spirit of cyberpunk.

This is a fully open project that can be used, modified, and distributed in accordance with the MIT license.

## 🎯 Key Features

- ✅ **Full-featured task tracker** with support for statuses, priorities, deadlines
- 🎮 **Gamification** with a level system, XP, and achievements
- 🎨 **Retro-terminal design** with dark/light theme support
- 🔐 **Role system** with differentiated access rights (ADMIN, DEVELOPER, VIEWER)
- 📊 **Multiple data views** (Table, Kanban, Graph, Calendar)
- ⏱️ **Time tracking** with built-in timer and auto-save
- 💾 **Full-Stack architecture** (PostgreSQL + Backend API + Frontend)
- 🔊 **Sound effects** for improved UX
- 🎯 **Code vault** with code snippet storage
- 💬 **Extended comments** with mentions, reactions, and editing
- 📁 **File uploads** to server with image previews
- 📈 **Data export** (CSV, JSON, PDF)
- 📅 **Event calendar** with deadline and status visualization
- 🔗 **Task dependencies** and tagging system
- 📱 **Mobile responsiveness** with touch-friendly interface
- 🔔 **Telegram notifications** for task events
- 🔒 **JWT authorization** and rate limiting for security
- ⚡ **Performance optimization** (code splitting, memoization, lazy loading)

---

## 📋 Table of Contents

- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [File Structure](#file-structure)
- [Core Features](#core-features)
- [System Components](#system-components)
- [Services](#services)
- [Installation and Setup](#installation-and-setup)
- [Usage](#usage)
- [Roles and Permissions](#roles-and-permissions)
- [API Integrations](#api-integrations)
- [Additional Features](#additional-features)

---

## 🛠 Technology Stack

### Frontend
- **React 19.2.1** — modern library for building user interfaces
- **TypeScript 5.8.2** — typed JavaScript for code reliability
- **React Router DOM 7.10.1** — routing in SPA

### Build & Development
- **Vite 6.2.0** — fast bundler and dev server
- **@vitejs/plugin-react 5.0.0** — React plugin for Vite

### Styling
- **Tailwind CSS** (CDN) — utility-first CSS framework
- Custom CSS variables for dark theme and neon effects
- Fonts: JetBrains Mono, VT323 (retro style)

### Backend
- **Node.js + Express** — Backend API server
- **PostgreSQL** — relational database

### Audio
- **Web Audio API** — programmatic sound effect generation (without external files)

---

## 🏗 Project Architecture

### State Management

The project uses **Context API** for centralized application state management:

- **AppContext** (`context/AppContext.tsx`) — main state provider
  - User, task, project, snippet management
  - Current user and application settings
  - All CRUD operations
  - Notification system
  - Theme and sound settings

### Data Storage

**Backend API + PostgreSQL (Full-Stack mode):**
- Data stored in PostgreSQL database
- REST API server on Node.js/Express
- Automatic connection when API is available
- All CRUD operations through API endpoints

**Local Storage (Fallback):**
- If API is unavailable, browser's `localStorage` is used
- Keys: `devterm_users`, `devterm_tasks`, `devterm_projects`, `devterm_snippets`
- Settings: `devterm_current_user_id`, `devterm_theme`, `devterm_color`, `devterm_sound`

### Routing

**HashRouter** is used for static deployment support:
- `/login` — login page
- `/dashboard` — main dashboard with tasks (search, sort, filters, export)
- `/task/:id` — task view/edit (auto-save, files, comments)
- `/create-task` — create new task
- `/calendar` — event calendar (creation, statuses, deadlines)
- `/snippets` — code vault
- `/logs` — system logs
- `/leaderboard` — leaderboard
- `/admin` — admin panel (ADMIN only)

Route protection is implemented through the `ProtectedRoute` component with JWT authorization.

### Code Splitting

The application uses **React.lazy** and **Suspense** for loading optimization:
- Lazy loading of all main pages
- Code splitting into chunks to reduce initial bundle size
- Loading fallback indicators

---

## 📁 File Structure

```
devconsole/
├── backend/                 # Backend API server
│   ├── server.js           # Express server with REST API
│   ├── package.json        # Backend dependencies
│   └── .env                # Environment variables (not in git)
│
├── components/              # Reusable components
│   ├── CommandPalette.tsx   # Command palette (Cmd+K)
│   ├── DashboardWidgets.tsx # Dashboard widgets (Kanban, charts, metrics)
│   ├── DigitalRain.tsx      # Matrix rain effect
│   ├── ErrorBoundary.tsx    # React error handling
│   ├── GraphView.tsx        # Task dependency graph
│   ├── Layout.tsx           # Main layout with sidebar
│   ├── SnakeGame.tsx        # Snake game (easter egg)
│   └── TerminalUI.tsx       # Basic UI components in terminal style
│
├── context/                 # React Context
│   └── AppContext.tsx       # Global application state
│
├── database/                # Database
│   └── schema.sql          # PostgreSQL SQL schema
│
├── hooks/                   # Custom React Hooks
│   └── useDebounce.ts       # Hook for debouncing values
│
├── pages/                   # Application pages
│   ├── AdminPanel.tsx       # Admin panel
│   ├── CalendarPage.tsx     # Task event calendar
│   ├── Dashboard.tsx        # Main tasks page
│   ├── Leaderboard.tsx      # Leaderboard (XP/levels)
│   ├── LoginPage.tsx        # Login page
│   ├── Snippets.tsx         # Code vault
│   ├── SystemLogs.tsx       # System logs
│   ├── TaskDetail.tsx       # Task detail view
│
├── services/                # External services
│   ├── apiService.ts        # REST API client for backend
│   ├── exportService.ts     # Data export (CSV, JSON, PDF)
│   ├── soundService.ts      # Sound effect generation
│   └── telegramService.ts   # Telegram notifications (backend)
│
├── App.tsx                  # Main component with routing
├── constants.ts             # Constants, initial data, utilities
├── index.html               # HTML template
├── index.tsx                # Entry point
├── types.ts                 # TypeScript types and interfaces
├── vite.config.ts           # Vite configuration
└── tsconfig.json            # TypeScript configuration
```

---

## ⚡ Core Features

### 1. Task Management

**Creating Tasks:**
- Title and description
- Project assignment
- Assignee assignment
- Priority setting (LOW, MEDIUM, HIGH, CRITICAL)
- Deadline setting
- Statuses: TODO → IN_PROGRESS → REVIEW → DONE (or BLOCKED)

**Editing Tasks:**
- Change all parameters with auto-save (2.5 sec debounce)
- Add subtasks (manually) with automatic progress calculation
- Extended comments with mentions (`@username`), reactions (👍❤️😄🎉), editing and deletion
- File uploads to server with image previews (up to 10MB)
- Detailed change history (Activity Log) with tracking of all fields
- Task dependencies (dependsOn) and tagging system
- Save indicator ("Saving...", "Saved ✓", "Error!")

### 2. Gamification System

**Levels and XP:**
- 100 unique levels with creative names ("Null Pointer", "Syntax Trainee", ..., "The Singularity")
- Formula: Level = floor(XP / 500) + 1 (maximum 100)
- Progress display to next level

**XP Awards:**
- Task completion: +150 XP
- High priority: +100 XP bonus
- Critical priority: +250 XP bonus
- Achievements provide additional XP

**Achievements:**
- "First Byte" — complete first task (+50 XP)
- "Bug Hunter" — complete 3 high/critical priority tasks (+300 XP)
- "Workaholic" — complete 10 tasks (+500 XP)
- "Time Lord" — log over 10 hours of work (+200 XP)
- "Early Bird" — complete task before 8:00 AM (+150 XP)
- "Night Owl" — complete task after 10:00 PM (+150 XP)
- "Weekend Warrior" — complete 3 tasks on weekends (+250 XP)
- "Streak Master" — complete tasks for 5 consecutive days (+400 XP)
- "Speed Demon" — complete task in less than 1 hour (+200 XP)

### 3. Time Tracking

- Built-in timer for each task
- Start/stop time tracking
- Cumulative time tracking (in seconds)
- Time formatting (HH:MM:SS)
- Automatic timer state saving to database
- State synchronization on page reload

### 4. Project Management

- Create projects with name and color
- Group tasks by projects
- Visual project indicators (colored badges)
- Filter tasks by projects

### 5. Code Vault

- Save code snippets with title and language
- Supported languages: JavaScript, TypeScript, Python, CSS, HTML, SQL
- Search by title and content

### 6. Data Visualization

**Three Display Modes:**

1. **Table** — classic table view with pagination
2. **Kanban Board** — board with status columns, drag-and-drop
3. **Graph View** — graph of relationships between tasks and users

**Additional:**
- Task statistics (distribution charts, metrics)
- Filtering by status, project, priority, assignee, deadline
- Text search and sorting by all fields (ID, title, deadline, completion date, priority, creation date, status)
- Drag & drop to change task order in table
- Export to CSV, JSON, PDF formats
- Mobile card view for small screens
- Widgets: metrics (active tasks, time today, upcoming, overdue), distribution chart, calendar

### 7. Notification System

- Toast notifications for all actions
- Types: success, error, info, warning
- Auto-hide
- Sound effects (optional)
- Telegram notifications on task creation, status change, assignee assignment
- Achievement notifications shown once per session

---

## 🧩 System Components

### Layout (`components/Layout.tsx`)

Main application layout component:
- **Sidebar** with navigation
- **User statistics** (level, XP, progress)
- **System monitors** (memory, CPU temperature - simulation)
- **Settings toggles** (theme, sound, effects)
- **RGB tuner** for changing color accents
- **Responsive design** for mobile devices

### Dashboard (`pages/Dashboard.tsx`)

Main task management page:
- Advanced filters by status, project, priority, assignee, deadline
- Text search in tasks
- Sorting by all fields (ID, title, deadline, completion date, priority, creation date, status)
- View mode switching (Table/Board/Graph)
- Pagination for table mode
- Drag & drop to change task order
- Export to CSV, JSON, PDF
- Widgets: metrics, task distribution chart
- Mobile adaptation with card view

### TaskDetail (`pages/TaskDetail.tsx`)

Task detail page:
- Edit all parameters with auto-save (2.5 sec debounce)
- Save indicator ("Saving...", "Saved ✓", "Error!")
- Subtask management (checklist) with automatic progress calculation
- Extended comments:
  - User mentions (`@username`) with Telegram notifications
  - Reactions (👍❤️😄🎉), visible on hover
  - Edit and delete own comments
- File uploads to server (up to 10MB) with image previews
- Task dependency and tag management
- Detailed change history (Activity Log) with tracking of all fields
- Time timer with auto-save state
- VIEWER role access check

### Snippets (`pages/Snippets.tsx`)

Code vault:
- List of saved snippets
- Form to add new snippet
- Search by content

### AdminPanel (`pages/AdminPanel.tsx`)

Admin panel:
- **User Management:**
  - Create new users
  - Edit existing users (name, role, avatar)
  - Role selection (ADMIN, DEVELOPER, VIEWER)
  - For VIEWER: configure allowed projects (allowedProjects)
  - Avatar generation/upload (DiceBear API or file)
  - Delete users

### CommandPalette (`components/CommandPalette.tsx`)

Universal command palette:
- Opens with `Cmd+K` / `Ctrl+K`
- Search commands by name
- Application navigation
- Quick actions (toggle theme, sound, etc.)
- Active command highlighting

### DashboardWidgets (`components/DashboardWidgets.tsx`)

Dashboard widgets:
- **KanbanBoard** — board with drag-and-drop
- **TaskStatsChart** — task statistics charts by status
- **TaskMetrics** — metrics (active tasks, time today, upcoming, overdue)
- **MiniCalendar** — mini calendar with task events

### CalendarPage (`pages/CalendarPage.tsx`)

Event calendar page:
- Full-screen calendar with month navigation
- Event visualization:
  - Task creation (blue dot)
  - Status change to IN_PROGRESS (green dot)
  - Task deadline (red dot)
- Detailed view of events for selected date
- Links to tasks for quick navigation

### GraphView (`components/GraphView.tsx`)

Dependency graph visualization:
- Nodes — tasks and users
- Connections — assignments and projects
- Interactive display

### TerminalUI (`components/TerminalUI.tsx`)

Basic UI components in terminal style:
- `TerminalButton` — buttons with style variants
- `TerminalInput` — input fields
- `TerminalTextArea` — text areas
- `TerminalCard` — cards with headers
- `StatusBadge` — task status badges
- `PriorityBadge` — priority badges
- `NotificationToast` — toast notifications

### Helper Components

- **DigitalRain** (`components/DigitalRain.tsx`) — matrix rain effect
- **SnakeGame** (`components/SnakeGame.tsx`) — Snake game (easter egg)
- **ErrorBoundary** (`components/ErrorBoundary.tsx`) — React error handling with fallback UI

---

## 🔧 Services

### API Service (`services/apiService.ts`)

REST API client for Backend interaction:

**Functions:**
- Automatic API URL detection (DigitalOcean or local)
- Support for relative paths for VPS via Nginx
- JWT authorization with automatic token addition to headers
- Methods for all CRUD operations:
  - Users: `getUsers()`, `createUser()`, `updateUser()`, `deleteUser()`
  - Tasks: `getTasks()`, `createTask()`, `updateTask()`, `deleteTask()`, `addComment()`, `editComment()`, `deleteComment()`, `addReaction()`
  - Projects: `getProjects()`, `createProject()`
  - Snippets: `getSnippets()`, `createSnippet()`, `deleteSnippet()`
  - Files: `uploadFile()`, `deleteFile()`, `getFileUrl()`
- Health check to verify API availability
- Retry mechanism for network errors (up to 2 retries)
- Graceful fallback to LocalStorage when API is unavailable

### Backend API (`backend/server.js`)

Node.js/Express REST API server:

**Endpoints:**
- `GET /health` — health check
- `POST /api/auth/login` — user authorization (JWT token)
- `GET /api/auth/verify` — token verification
- `GET /api/users` — user list (optional authorization)
- `POST /api/users` — create user (requires ADMIN)
- `PUT /api/users/:id` — update user (requires ADMIN)
- `DELETE /api/users/:id` — delete user (requires ADMIN)
- `GET /api/tasks` — task list (optional authorization)
- `POST /api/tasks` — create task (requires authorization)
- `PUT /api/tasks/:id` — update task (requires authorization)
- `DELETE /api/tasks/:id` — delete task (requires authorization)
- `POST /api/tasks/:id/comments` — add comment (requires authorization)
- `PUT /api/tasks/:id/comments/:commentId` — edit comment (requires authorization)
- `DELETE /api/tasks/:id/comments/:commentId` — delete comment (requires authorization)
- `POST /api/tasks/:id/comments/:commentId/reactions` — add/remove reaction (requires authorization)
- `POST /api/files/upload` — upload file (requires authorization, up to 10MB)
- `DELETE /api/files/:filename` — delete file (requires authorization)
- `GET /uploads/:filename` — get uploaded file
- Similar endpoints for projects and snippets

**Security:**
- JWT authorization with tokens (default 7 days)
- Rate limiting:
  - General limit: 100 requests per 15 minutes
  - Strict limit for login: 5 attempts per 15 minutes
- Role-based access control (RBAC) for admin functions
- Trust proxy for correct operation behind Nginx

**Database:**
- PostgreSQL via `pg` library
- Automatic connection with reconnect
- SSL support for production
- JSONB for complex data structures (subtasks, comments, activityLog)
- TEXT[] arrays for tags, dependencies, allowedProjects

**Telegram Notifications:**
- Telegram Bot API integration
- Notifications on task creation, status change, assignee assignment
- Notifications for mentions in comments (`@username`)

### Sound Service (`services/soundService.ts`)

Sound effect generation via Web Audio API:

**Functions:**
- `playHover()` — hover sound
- `playClick()` — click sound
- `playSuccess()` — success sound
- `playError()` — error sound
- `playNotification()` — notification sound
- `playStartTimer()` — timer start sound
- `playStopTimer()` — timer stop sound
- `setMuted(muted)` — mute/unmute sound

All sounds are generated programmatically (without external files).

### Export Service (`services/exportService.ts`)

Data export to various formats:

**Functions:**
- `exportToCSV()` — export tasks to CSV format with formatting
- `exportToJSON()` — export tasks to JSON with metadata
- `exportToPDF()` — export tasks to PDF with table view (uses jsPDF)

**Export formats include:**
- ID, title, description, project, status, priority
- Assignee, deadline, completion date
- Time spent (formatted)

### Telegram Service (`services/telegramService.ts`)

Telegram Bot API integration for notifications:

**Functions:**
- `sendTelegramNotification(message)` — send message to Telegram chat
- Markdown message formatting
- Error handling without interrupting main functionality

**Required:**
- `TELEGRAM_BOT_TOKEN` — bot token from @BotFather
- `TELEGRAM_CHAT_ID` — chat ID for notifications

---

## 🚀 Installation and Setup

### Prerequisites

- **Node.js** (version 18 or higher)
- **npm** or **yarn**
- **Git** (for cloning repository)
- **PostgreSQL** (version 16 or higher, for Full-Stack mode, optional)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/D371L/devconsole.git
   cd devconsole
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Create a `.env.local` file in the project root:
   ```env
   VITE_API_URL=http://localhost:8080/api
   ```

4. **Start dev server:**
   ```bash
   npm run dev
   ```

   The application will be available at: `http://localhost:3000`

### Backend API Setup (optional, for Full-Stack mode)

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure PostgreSQL:**
   ```bash
   # Create database
   createdb devconsole
   
   # Or via psql:
   psql -U postgres
   CREATE DATABASE devconsole;
   \q
   ```

3. **Initialize database schema:**
   ```bash
   psql -U postgres -d devconsole < ../database/schema.sql
   ```

4. **Create `.env` file in `backend/` folder:**
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/devconsole
   PORT=8080
   NODE_ENV=development
   JWT_SECRET=your_secret_key_change_in_production
   JWT_EXPIRES_IN=7d
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token (optional)
   TELEGRAM_CHAT_ID=your_telegram_chat_id (optional)
   ```

5. **Start backend:**
   ```bash
   npm start
   ```

   Backend will be available at: `http://localhost:8080`

   **Note:** The application will automatically detect API availability and use it instead of LocalStorage.

### Production Build

```bash
npm run build
```

Build output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

---

## 📖 Usage

### Login

On first run, use test accounts:

| Username  | Password | Role       | Description        |
|-----------|----------|------------|---------------------|
| `admin`   | `password` | ADMIN     | Full access        |
| `dev_jane`| `password` | DEVELOPER | Task creation      |
| `dev_john`| `password` | DEVELOPER | Task creation      |

Password for all: `password`

### Creating a Task

1. Click the **"+ NEW DIRECTIVE"** button on the dashboard
2. Fill in required fields:
   - Task title
   - Description
   - Project
3. Optional:
   - Assign assignee
   - Set priority and deadline
   - Add subtasks
   - Attach images
4. Click **"EXECUTE SAVE"**

### Command Palette

Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) to open the command palette.

**Available commands:**
- Go to Dashboard
- Create New Directive
- Open Code Vault
- View System Logs
- Toggle System Theme
- Toggle Sound FX
- Toggle Matrix Rain
- run protocol_snake
- Admin Panel (ADMIN only)
- Disconnect (Logout)

### Settings

The sidebar has toggles:

- **THEME_MODE** — switch between light and dark theme
- **AUDIO_FX** — enable/disable sound effects
- **MATRIX_FX** — enable/disable matrix rain effect
- **RGB_TUNING** — choose color accent (Cyan, Purple, Green, Amber, Pink)

---

## 👥 Roles and Permissions

### ADMIN (Administrator)

**Full access to all functions:**
- Create, edit, and delete tasks
- User management (create, delete)
- Access to Admin Panel
- View all tasks and data

### DEVELOPER

**Access to core functionality:**
- Create and edit tasks
- Manage own tasks
- Access to code vault
- View dashboard and statistics
- **No access:** Admin Panel, user management

### VIEWER

**Read-only:**
- View tasks only from allowed projects (`allowedProjects`)
- View dashboard and charts (filtered by allowed projects)
- View code vault
- Comments read-only (no editing or reactions)
- **No access:** task creation, editing, Admin Panel, file management

---

## 🔌 API Integrations

### Telegram Bot API

**Purpose:** Notifications for task events

**Required:**
- Create bot via @BotFather in Telegram
- Get `TELEGRAM_BOT_TOKEN`
- Get `TELEGRAM_CHAT_ID` (group or private chat ID)
- Set in backend environment variables

**Notification Types:**
- New task creation
- Task status change (especially to DONE)
- Assignee assignment
- Mentions in comments (`@username`)

---

## 🎨 Additional Features

### Theming

**Dark Theme:**
- Neon effects (glow)
- CRT scanline overlay
- High contrast
- Support for 5 color accents

**Light Theme:**
- Clean minimalist design
- Standard colors

Theme switching is saved in `localStorage`.

### Sound Effects

All sounds are generated via Web Audio API:
- Retro-synthesized sounds
- Different tones for different actions
- Can be disabled in settings

### Effects

**Digital Rain (Matrix Rain):**
- Animated background effect
- Enabled in settings
- Works only in dark theme

**Snake Game:**
- Easter egg, activated via Command Palette
- Classic Snake game
- Arrow key controls

### System Monitors

The footer displays (simulation):
- **HEAP_MEM** — browser memory usage
- **CPU_TEMP** — CPU temperature (simulation)

Chrome/Edge uses the real `performance.memory` API.

### Responsiveness

- Full mobile device support
- Responsive sidebar
- Optimized forms for touch devices
- Responsive charts and tables

---

## 📝 Data Structure

### Task

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: number;
  deadline?: string;
  completedAt?: number | null; // Timestamp when task was completed
  status: TaskStatus; // TODO | IN_PROGRESS | REVIEW | DONE | BLOCKED
  priority: Priority; // LOW | MEDIUM | HIGH | CRITICAL
  attachments: string[]; // File URLs on server (/uploads/filename) or base64 (legacy)
  subtasks: Subtask[];
  comments: Comment[];
  activityLog: ActivityLog[];
  timeSpent: number; // seconds
  timerStartedAt?: number | null; // Timestamp when timer was started
  dependsOn?: string[]; // Array of task IDs this task depends on
  tags?: string[]; // Array of tags (strings)
  order?: number; // Order for sorting (drag & drop)
  progress?: number; // Completion progress (0-100%) based on subtasks
}
```

### User

```typescript
interface User {
  id: string;
  username: string;
  password?: string;
  role: Role; // ADMIN | DEVELOPER | VIEWER
  avatar?: string;
  xp: number;
  achievements: string[]; // Array of achievement IDs
  allowedProjects?: string[]; // Array of project IDs for VIEWER role
}
```

### Project

```typescript
interface Project {
  id: string;
  name: string;
  color: string; // Hex color
}
```

### Snippet

```typescript
interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  createdBy: string;
  timestamp: number;
}
```

### Comment

```typescript
interface Comment {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
  mentions?: string[]; // Array of user IDs mentioned via @username
  reactions?: { [emoji: string]: string[] }; // Object: { '👍': ['userId1', 'userId2'] }
  edited?: boolean; // Whether comment was edited
  editedAt?: number; // Timestamp of last edit
}
```

### ActivityLog

```typescript
interface ActivityLog {
  id: string;
  userId: string;
  action: string; // Action name (e.g., 'UPDATE_TASK', 'CHANGE_STATUS')
  timestamp: number;
  fieldName?: string; // Name of changed field (e.g., 'title', 'status')
  oldValue?: any; // Previous field value
  newValue?: any; // New field value
}
```

### Subtask

```typescript
interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}
```

---

## 🔄 Constants and Initial Data

All initial data is defined in `constants.ts`:

- `INITIAL_USERS` — initial users
- `INITIAL_TASKS` — initial tasks
- `INITIAL_PROJECTS` — initial projects
- `INITIAL_SNIPPETS` — initial code snippets
- `ACHIEVEMENTS` — achievement list
- `LEVEL_TITLES` — level names (100 items)
- `STATUS_COLORS` — status colors

---

## 🎯 Implementation Details

### Data Storage

**Usage Priority:**
1. Backend API + PostgreSQL (if available)
2. LocalStorage (fallback, only for settings and current user)

**LocalStorage is used only for:**
- `devterm_current_user_id` — current user ID
- `devterm_theme` — interface theme
- `devterm_color` — color accent
- `devterm_sound` — sound settings
- `devterm_jwt_token` — JWT token for authorization

**Task, project, and user data is stored only in PostgreSQL.**

### Error Handling

- **ErrorBoundary** — global React error handling with fallback UI
- Retry mechanism for API network errors (up to 2 retries)
- Informative error messages for users
- Error logging to console for debugging

### Performance

- **Code Splitting** — lazy loading of all main pages via `React.lazy`
- **Memoization** — `useMemo` for computed lists, `useCallback` for functions
- **Debounce** — auto-save with 2.5 second delay to reduce requests
- Optimized rerenders via correct hook dependencies
- Virtualization of large lists (ready, but not active due to drag & drop)

### Security

- **JWT Authorization** — tokens with expiration (default 7 days)
- **Rate Limiting** — protection against API abuse:
  - General limit: 100 requests per 15 minutes
  - Login: 5 attempts per 15 minutes
- **Role-based access control (RBAC)** — permission checks at API and UI level
- Route protection via `ProtectedRoute`
- Access permission checks at component level
- **Note:** In current implementation, passwords are stored in plain text. For production, it is recommended to use bcrypt or similar libraries.

---

## 🌐 Deployment

The application supports multiple deployment options:

### 📊 GitHub Pages

For frontend-only deployment:

- **GitHub Pages** — free hosting for open source
- ✅ Automatic deployment via GitHub Actions
- Test data available to demonstrate all features

### Current Deployment

🌐 **Demo version on GitHub Pages:**
- URL: [https://username.github.io/devconsole](https://username.github.io/devconsole) (replace `username` with your GitHub username)
- Status: ✅ Automatic deployment via GitHub Actions
- Test data available to demonstrate all features

🌐 **Production deployment:**
- URL: https://console.vaadbot.com
- Backend API: https://console.vaadbot.com/api/health
- SSL: ✅ Configured (Let's Encrypt via Certbot)
- Status: ✅ Working
- Domain: `console.vaadbot.com`

**Infrastructure:**
- Frontend: Nginx (static site)
- Backend: Node.js/Express via PM2
- Database: PostgreSQL
- SSL: Let's Encrypt (auto-update)

---

## 🤝 Contributing

We welcome contributions! If you want to help improve DevConsole:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Before submitting a PR, make sure:
- Code follows the project style
- All tests pass (if any)
- You updated documentation if necessary

---

## 🙏 Acknowledgments

Thanks to everyone who contributed to DevConsole development!

---

## 📄 License

This project is distributed under the MIT license. See the [LICENSE](LICENSE) file for details.

### What does this mean?

The MIT license is one of the most permissive open source licenses. You can:

- ✅ Use the project for commercial purposes
- ✅ Modify and change the code
- ✅ Distribute the project
- ✅ Use in private projects
- ✅ Deploy code to production

**The only requirement:** maintain the copyright and license text in distributed files.

---

## 🔗 Useful Links

- **Vite:** https://vitejs.dev/
- **React Router:** https://reactrouter.com/

---

## 👨‍💻 Development

### Development Structure

1. All components in `components/` folder
2. Pages in `pages/` folder
3. Services in `services/` folder
4. Types in `types.ts`
5. Constants in `constants.ts`

### Code Style

- TypeScript for typing
- Functional Components with Hooks
- Naming: PascalCase for components, camelCase for functions
- Comments in English in code

---

**DevConsole v3.0** — Full-Stack task management application in cyberpunk style 🚀

**Architecture:** Frontend (React) + Backend API (Node.js/Express) + PostgreSQL + Telegram

**Key Technologies:**
- React 19 + TypeScript + Vite
- Express.js + PostgreSQL
- JWT authorization + Rate limiting
- Telegram Bot API
- Code splitting + Performance optimization

**Status:** ✅ Production Ready
