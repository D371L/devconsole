
import { Role, TaskStatus, Priority, User, Task, Snippet, Achievement, Project } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin',
    password: 'password', // Mock password
    role: Role.ADMIN,
    avatar: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=admin_core',
    xp: 12500,
    achievements: ['a1']
  },
  {
    id: 'u2',
    username: 'dev_jane',
    password: 'password',
    role: Role.DEVELOPER,
    avatar: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=jane_dev',
    xp: 4500,
    achievements: []
  },
  {
    id: 'u3',
    username: 'dev_john',
    password: 'password',
    role: Role.DEVELOPER,
    avatar: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=john_dev',
    xp: 1200,
    achievements: []
  }
];

export const INITIAL_PROJECTS: Project[] = [
    { id: 'p1', name: 'Alpha Core', color: '#00f3ff' },
    { id: 'p2', name: 'Project Titan', color: '#bd00ff' },
    { id: 'p3', name: 'Legacy Systems', color: '#ffbf00' }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Initialize System Core',
    description: 'Setup the main React repository and install Tailwind CSS.',
    projectId: 'p1',
    createdBy: 'u1',
    assignedTo: 'u2',
    createdAt: Date.now(),
    deadline: '2024-12-31',
    status: TaskStatus.DONE,
    priority: Priority.HIGH,
    attachments: [],
    subtasks: [
        { id: 'st1', title: 'Install Dependencies', completed: true },
        { id: 'st2', title: 'Configure Tailwind', completed: true }
    ],
    comments: [
      { id: 'c1', userId: 'u2', text: 'Core systems online. Ready for modules.', timestamp: Date.now() - 100000 }
    ],
    activityLog: [
      { id: 'l1', userId: 'u1', action: 'Created task', timestamp: Date.now() - 200000 },
      { id: 'l2', userId: 'u2', action: 'Changed status to DONE', timestamp: Date.now() - 100000 }
    ],
    timeSpent: 3600, // 1 hour
    timerStartedAt: null
  },
  {
    id: 't2',
    title: 'Implement Auth Module',
    description: 'Create secure login/logout flow with JWT handling.',
    projectId: 'p1',
    createdBy: 'u1',
    assignedTo: 'u2',
    createdAt: Date.now(),
    deadline: '2025-01-15',
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.CRITICAL,
    attachments: [],
    subtasks: [],
    comments: [],
    activityLog: [
       { id: 'l3', userId: 'u1', action: 'Created task', timestamp: Date.now() }
    ],
    timeSpent: 0,
    timerStartedAt: null
  }
];

export const INITIAL_SNIPPETS: Snippet[] = [
    {
        id: 's1',
        title: 'React UseEffect Hook',
        language: 'typescript',
        code: 'useEffect(() => {\n  console.log("Mounted");\n  return () => console.log("Unmounted");\n}, []);',
        createdBy: 'u1',
        timestamp: Date.now()
    }
];

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
