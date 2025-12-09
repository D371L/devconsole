
import { Role, TaskStatus, Priority, User, Task, Snippet, Achievement, Project } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin',
    password: 'password', // Mock password
    role: Role.ADMIN,
    avatar: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=admin_core',
    xp: 0,
    achievements: []
  }
];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_SNIPPETS: Snippet[] = [];

export const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'text-gray-400 border-gray-400',
  [TaskStatus.IN_PROGRESS]: 'text-blue-400 border-blue-400',
  [TaskStatus.REVIEW]: 'text-yellow-400 border-yellow-400',
  [TaskStatus.DONE]: 'text-green-500 border-green-500',
  [TaskStatus.BLOCKED]: 'text-red-500 border-red-500',
};

// 100 Levels of titles
export const LEVEL_TITLES = [
    "Null Pointer", "Syntax Trainee", "Hello Worlder", "Console Logger", "Variable Declarer", // 1-5
    "Loop Looper", "Array Indexer", "Object Mapper", "Function Caller", "Script Kiddie", // 6-10
    "Git Cloner", "Merge Conflicter", "Bug Hunter", "Patch Applied", "Code Monkey", // 11-15
    "CSS Tinkerer", "Flexbox Fumbler", "Grid Grinder", "Responsive Rookie", "Pixel Pusher", // 16-20
    "DOM Manipulator", "Event Listener", "Callback Hell Survivor", "Promise Keeper", "Async Awaiter", // 21-25
    "API Consumer", "JSON Parser", "Fetch Fanatic", "RESTful Rookie", "GraphQL Grokcer", // 26-30
    "Component Creator", "Prop Driller", "State Manager", "Hook Hooker", "Context Consumer", // 31-35
    "Redux Wrestler", "MobX Master", "Zustand Zealot", "Router Ranger", "Single Page Architect", // 36-40
    "Backend Beginner", "Node Novice", "Express Explorer", "Middleware Maniac", "Database Dabbler", // 41-45
    "SQL Selecter", "NoSQL Nomad", "Schema Shaper", "Query Queen", "Migration Master", // 46-50
    "Docker Docker", "Container Captain", "Kubernetes Kid", "Cloud Climber", "Serverless Surfer", // 51-55
    "Test Tester", "Unit Unicorn", "Integration Invader", "E2E Expert", "TDD Titan", // 56-60
    "Refactoring Rogue", "Clean Coder", "Pattern Practitioner", "SOLID Soldier", "DRY Defender", // 61-65
    "Performance Polisher", "Memory Leaker", "Bundle Buster", "Optimization Oracle", "V8 Velocity", // 66-70
    "Security Sentinel", "XSS Exterminator", "CSRF Crusher", "Auth Authority", "Encryption Enigma", // 71-75
    "DevOps Dynamo", "CI/CD Commander", "Pipeline Pilot", "Infrastructure Idol", "Reliability Rock", // 76-80
    "System Architect", "Microservice Monk", "Event Driven Entity", "Scalability Sage", "High Availability Hero", // 81-85
    "Tech Lead", "Mentor Machine", "Code Review Rex", "Legacy Liberator", "Technical Debt Destroyer", // 86-90
    "Fellow Engineer", "Distinguished Dev", "Principal Programmer", "Algorithmic Alchemist", "Binary Wizard", // 91-95
    "Neural Net Master", "Deep Learning Deity", "Quantum Coder", "Cyberpunk Legend", "The Singularity" // 96-100
];

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'a1',
        title: 'First Byte',
        description: 'Complete your first task',
        icon: '🥚',
        xpBonus: 50,
        condition: (u, tasks) => tasks.some(t => t.assignedTo === u.id && t.status === TaskStatus.DONE)
    },
    {
        id: 'a2',
        title: 'Bug Hunter',
        description: 'Complete 3 High or Critical priority tasks',
        icon: '🐞',
        xpBonus: 300,
        condition: (u, tasks) => tasks.filter(t => t.assignedTo === u.id && t.status === TaskStatus.DONE && (t.priority === Priority.HIGH || t.priority === Priority.CRITICAL)).length >= 3
    },
    {
        id: 'a3',
        title: 'Workaholic',
        description: 'Complete 10 tasks total',
        icon: '🦾',
        xpBonus: 500,
        condition: (u, tasks) => tasks.filter(t => t.assignedTo === u.id && t.status === TaskStatus.DONE).length >= 10
    },
    {
        id: 'a4',
        title: 'Time Lord',
        description: 'Log over 10 hours of work',
        icon: '⏳',
        xpBonus: 200,
        condition: (u, tasks) => {
            const totalSeconds = tasks.filter(t => t.assignedTo === u.id).reduce((acc, t) => acc + (t.timeSpent || 0), 0);
            return totalSeconds >= 36000;
        }
    },
    {
        id: 'a5',
        title: 'Early Bird',
        description: 'Complete a task between 6-9 AM',
        icon: '🌅',
        xpBonus: 150,
        condition: (u, tasks) => {
            return tasks.some(t => {
                if (t.assignedTo !== u.id || t.status !== TaskStatus.DONE || !t.completedAt) return false;
                const completedDate = new Date(t.completedAt);
                const hour = completedDate.getHours();
                return hour >= 6 && hour < 9;
            });
        }
    },
    {
        id: 'a6',
        title: 'Night Owl',
        description: 'Complete a task between 10 PM - 2 AM',
        icon: '🦉',
        xpBonus: 150,
        condition: (u, tasks) => {
            return tasks.some(t => {
                if (t.assignedTo !== u.id || t.status !== TaskStatus.DONE || !t.completedAt) return false;
                const completedDate = new Date(t.completedAt);
                const hour = completedDate.getHours();
                return (hour >= 22 || hour < 2);
            });
        }
    },
    {
        id: 'a7',
        title: 'Weekend Warrior',
        description: 'Complete 3 tasks on weekends',
        icon: '🏋️',
        xpBonus: 250,
        condition: (u, tasks) => {
            const weekendTasks = tasks.filter(t => {
                if (t.assignedTo !== u.id || t.status !== TaskStatus.DONE || !t.completedAt) return false;
                const completedDate = new Date(t.completedAt);
                const dayOfWeek = completedDate.getDay();
                return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
            });
            return weekendTasks.length >= 3;
        }
    },
    {
        id: 'a8',
        title: 'Streak Master',
        description: 'Complete tasks for 5 consecutive days',
        icon: '🔥',
        xpBonus: 400,
        condition: (u, tasks) => {
            const completedTasks = tasks
                .filter(t => t.assignedTo === u.id && t.status === TaskStatus.DONE && t.completedAt)
                .map(t => {
                    const date = new Date(t.completedAt!);
                    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
                })
                .filter((date, index, self) => self.indexOf(date) === index) // Unique dates
                .sort((a, b) => a - b);

            if (completedTasks.length < 5) return false;

            // Check for consecutive days
            for (let i = 0; i <= completedTasks.length - 5; i++) {
                let consecutive = true;
                for (let j = 1; j < 5; j++) {
                    const daysDiff = (completedTasks[i + j] - completedTasks[i + j - 1]) / (1000 * 60 * 60 * 24);
                    if (daysDiff !== 1) {
                        consecutive = false;
                        break;
                    }
                }
                if (consecutive) return true;
            }
            return false;
        }
    },
    {
        id: 'a9',
        title: 'Speed Demon',
        description: 'Complete a task in under 1 hour',
        icon: '⚡',
        xpBonus: 200,
        condition: (u, tasks) => {
            return tasks.some(t => {
                if (t.assignedTo !== u.id || t.status !== TaskStatus.DONE || !t.completedAt || !t.createdAt) return false;
                const createdTime = typeof t.createdAt === 'string' ? parseInt(t.createdAt, 10) : t.createdAt;
                const completedTime = typeof t.completedAt === 'string' ? parseInt(t.completedAt, 10) : t.completedAt;
                const timeDiff = (completedTime - createdTime) / (1000 * 60 * 60); // hours
                return timeDiff < 1 && timeDiff > 0;
            });
        }
    }
];

export const getLevelInfo = (xp: number) => {
    // Simple formula: Level = floor(XP / 500) + 1, max 100
    const level = Math.min(100, Math.floor(xp / 500) + 1);
    const nextLevelXp = level * 500;
    const progress = ((xp % 500) / 500) * 100;
    
    // Adjust for level 100 cap
    if (level === 100) return { level: 100, title: LEVEL_TITLES[99], progress: 100, nextLevelXp: 'MAX' };

    return {
        level,
        title: LEVEL_TITLES[level - 1] || "Unknown Entity",
        progress,
        nextLevelXp
    };
};
