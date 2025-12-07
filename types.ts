
export enum Role {
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
  VIEWER = 'VIEWER'
}

export interface User {
  id: string;
  username: string;
  password?: string; // In a real app, this would be hashed or handled by auth service
  role: Role;
  avatar?: string;
  xp: number;
  achievements: string[]; // Array of Achievement IDs
}

export interface Project {
  id: string;
  name: string;
  color: string; // Hex code for UI decoration
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  timestamp: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string; // Linked Project ID
  assignedTo?: string; // User ID
  createdBy: string; // User ID
  createdAt: number;
  deadline?: string;
  status: TaskStatus;
  priority: Priority;
  attachments: string[]; // Base64 strings for simplicity
  subtasks: Subtask[];
  comments: Comment[];
  activityLog: ActivityLog[];
  // Time Tracking
  timeSpent: number; // Total seconds accumulated
  timerStartedAt?: number | null; // Timestamp when current session started, or null if paused
}

export interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  createdBy: string;
  timestamp: number;
}

export interface TaskFilter {
  status?: TaskStatus;
  assignedTo?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    xpBonus: number;
    condition: (user: User, tasks: Task[]) => boolean;
}
