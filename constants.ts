
import { Role, TaskStatus, Priority, User, Task, Snippet, Achievement, Project } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin',
    password: 'password', // Mock password
    role: Role.ADMIN,
    avatar: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=admin_core',
    xp: 2500,
    achievements: ['a1', 'a3']
  },
  {
    id: 'u2',
    username: 'dev_jane',
    password: 'password',
    role: Role.DEVELOPER,
    avatar: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=jane_dev',
    xp: 1800,
    achievements: ['a1', 'a2']
  },
  {
    id: 'u3',
    username: 'dev_john',
    password: 'password',
    role: Role.DEVELOPER,
    avatar: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=john_dev',
    xp: 1200,
    achievements: ['a1']
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Web Platform',
    color: '#3B82F6'
  },
  {
    id: 'p2',
    name: 'Mobile App',
    color: '#10B981'
  },
  {
    id: 'p3',
    name: 'API Service',
    color: '#8B5CF6'
  },
  {
    id: 'p4',
    name: 'DevOps Infrastructure',
    color: '#F59E0B'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Implement user authentication',
    description: 'Set up JWT-based authentication system with login and registration endpoints. Include password hashing, token generation, and refresh token mechanism.',
    projectId: 'p1',
    assignedTo: 'u2',
    createdBy: 'u1',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
    completedAt: null,
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    attachments: [],
    subtasks: [
      { id: 's1', title: 'Design authentication flow', completed: true },
      { id: 's2', title: 'Implement JWT token generation', completed: true },
      { id: 's3', title: 'Create login endpoint', completed: false },
      { id: 's4', title: 'Add password reset functionality', completed: false }
    ],
    comments: [],
    activityLog: [
      {
        id: 'l1',
        userId: 'u1',
        action: 'CREATE_TASK',
        timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
        fieldName: 'status',
        oldValue: undefined,
        newValue: 'TODO'
      },
      {
        id: 'l2',
        userId: 'u2',
        action: 'CHANGE_STATUS',
        timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000,
        fieldName: 'status',
        oldValue: 'TODO',
        newValue: 'IN_PROGRESS'
      }
    ],
    timeSpent: 14400, // 4 hours
    timerStartedAt: null,
    dependsOn: [],
    tags: ['backend', 'security', 'auth'],
    order: 0,
    progress: 50
  },
  {
    id: 't2',
    title: 'Design dashboard UI',
    description: 'Create modern and responsive dashboard interface with task management widgets, statistics charts, and interactive filters.',
    projectId: 'p1',
    assignedTo: 'u2',
    createdBy: 'u1',
    createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
    completedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    status: TaskStatus.DONE,
    priority: Priority.MEDIUM,
    attachments: [],
    subtasks: [
      { id: 's5', title: 'Create layout components', completed: true },
      { id: 's6', title: 'Implement responsive design', completed: true },
      { id: 's7', title: 'Add interactive widgets', completed: true }
    ],
    comments: [
      {
        id: 'c1',
        userId: 'u2',
        text: 'Great progress on the UI design! The widgets look amazing. @admin should we add more charts?',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
        mentions: ['u1'],
        reactions: { '👍': ['u1'], '🎉': ['u3'] },
        edited: false
      }
    ],
    activityLog: [
      {
        id: 'l3',
        userId: 'u1',
        action: 'CREATE_TASK',
        timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000
      },
      {
        id: 'l4',
        userId: 'u2',
        action: 'CHANGE_STATUS',
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
        fieldName: 'status',
        oldValue: 'TODO',
        newValue: 'IN_PROGRESS'
      },
      {
        id: 'l5',
        userId: 'u2',
        action: 'CHANGE_STATUS',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
        fieldName: 'status',
        oldValue: 'IN_PROGRESS',
        newValue: 'DONE'
      }
    ],
    timeSpent: 21600, // 6 hours
    timerStartedAt: null,
    dependsOn: [],
    tags: ['frontend', 'ui', 'design'],
    order: 1,
    progress: 100
  },
  {
    id: 't3',
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment. Include unit tests, integration tests, and automated deployment to staging and production environments.',
    projectId: 'p1',
    assignedTo: 'u3',
    createdBy: 'u1',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    completedAt: null,
    status: TaskStatus.REVIEW,
    priority: Priority.CRITICAL,
    attachments: [],
    subtasks: [
      { id: 's8', title: 'Configure GitHub Actions', completed: true },
      { id: 's9', title: 'Set up test suite', completed: true },
      { id: 's10', title: 'Configure deployment steps', completed: false }
    ],
    comments: [],
    activityLog: [
      {
        id: 'l6',
        userId: 'u1',
        action: 'CREATE_TASK',
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000
      },
      {
        id: 'l7',
        userId: 'u3',
        action: 'CHANGE_STATUS',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
        fieldName: 'status',
        oldValue: 'TODO',
        newValue: 'IN_PROGRESS'
      },
      {
        id: 'l8',
        userId: 'u3',
        action: 'CHANGE_STATUS',
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        fieldName: 'status',
        oldValue: 'IN_PROGRESS',
        newValue: 'REVIEW'
      }
    ],
    timeSpent: 10800, // 3 hours
    timerStartedAt: null,
    dependsOn: ['t1'],
    tags: ['devops', 'ci-cd', 'automation'],
    order: 2,
    progress: 67
  },
  {
    id: 't4',
    title: 'Mobile app navigation',
    description: 'Implement bottom navigation and drawer menu for mobile application. Include smooth animations and gesture support.',
    projectId: 'p2',
    assignedTo: 'u2',
    createdBy: 'u1',
    createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000, // 6 days ago
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days from now
    completedAt: null,
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    attachments: [],
    subtasks: [
      { id: 's11', title: 'Design navigation structure', completed: false },
      { id: 's12', title: 'Implement bottom nav', completed: false },
      { id: 's13', title: 'Add drawer menu', completed: false }
    ],
    comments: [],
    activityLog: [
      {
        id: 'l9',
        userId: 'u1',
        action: 'CREATE_TASK',
        timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000
      }
    ],
    timeSpent: 0,
    timerStartedAt: null,
    dependsOn: [],
    tags: ['mobile', 'navigation', 'ui'],
    order: 3,
    progress: 0
  },
  {
    id: 't5',
    title: 'API rate limiting',
    description: 'Implement rate limiting middleware to prevent API abuse. Support different rate limits for different endpoints and user roles.',
    projectId: 'p3',
    assignedTo: 'u3',
    createdBy: 'u1',
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000, // 4 days ago
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 days from now
    completedAt: null,
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    attachments: [],
    subtasks: [
      { id: 's14', title: 'Research rate limiting strategies', completed: true },
      { id: 's15', title: 'Implement middleware', completed: false }
    ],
    comments: [
      {
        id: 'c2',
        userId: 'u3',
        text: 'Need to discuss rate limits with @admin. What should be the limits for authenticated vs anonymous users?',
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        mentions: ['u1'],
        reactions: {},
        edited: false
      }
    ],
    activityLog: [
      {
        id: 'l10',
        userId: 'u1',
        action: 'CREATE_TASK',
        timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000
      },
      {
        id: 'l11',
        userId: 'u3',
        action: 'CHANGE_STATUS',
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        fieldName: 'status',
        oldValue: 'TODO',
        newValue: 'IN_PROGRESS'
      }
    ],
    timeSpent: 5400, // 1.5 hours
    timerStartedAt: null,
    dependsOn: [],
    tags: ['backend', 'security', 'api'],
    order: 4,
    progress: 50
  },
  {
    id: 't6',
    title: 'Database optimization',
    description: 'Optimize database queries and add necessary indexes. Analyze slow queries and improve performance.',
    projectId: 'p3',
    assignedTo: 'u3',
    createdBy: 'u1',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago (overdue)
    completedAt: null,
    status: TaskStatus.BLOCKED,
    priority: Priority.MEDIUM,
    attachments: [],
    subtasks: [],
    comments: [
      {
        id: 'c3',
        userId: 'u3',
        text: 'Waiting for database access credentials from @admin',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
        mentions: ['u1'],
        reactions: {},
        edited: false
      }
    ],
    activityLog: [
      {
        id: 'l12',
        userId: 'u1',
        action: 'CREATE_TASK',
        timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000
      },
      {
        id: 'l13',
        userId: 'u3',
        action: 'CHANGE_STATUS',
        timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
        fieldName: 'status',
        oldValue: 'TODO',
        newValue: 'BLOCKED'
      }
    ],
    timeSpent: 7200, // 2 hours
    timerStartedAt: null,
    dependsOn: [],
    tags: ['database', 'performance', 'optimization'],
    order: 5,
    progress: 0
  },
  {
    id: 't7',
    title: 'User profile page',
    description: 'Create user profile page with avatar, stats, and activity history. Include editable fields and achievements display.',
    projectId: 'p1',
    assignedTo: 'u2',
    createdBy: 'u1',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 8 days from now
    completedAt: null,
    status: TaskStatus.TODO,
    priority: Priority.LOW,
    attachments: [],
    subtasks: [],
    comments: [],
    activityLog: [
      {
        id: 'l14',
        userId: 'u1',
        action: 'CREATE_TASK',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000
      }
    ],
    timeSpent: 0,
    timerStartedAt: null,
    dependsOn: ['t2'],
    tags: ['frontend', 'profile', 'user'],
    order: 6,
    progress: 0
  },
  {
    id: 't8',
    title: 'Deploy to production server',
    description: 'Set up production deployment on VPS with Nginx, SSL certificates, and monitoring. Configure backups and disaster recovery.',
    projectId: 'p4',
    assignedTo: 'u3',
    createdBy: 'u1',
    createdAt: Date.now() - 9 * 24 * 60 * 60 * 1000, // 9 days ago
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
    completedAt: null,
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    attachments: [],
    subtasks: [
      { id: 's16', title: 'Set up VPS server', completed: true },
      { id: 's17', title: 'Configure Nginx', completed: true },
      { id: 's18', title: 'Install SSL certificates', completed: false },
      { id: 's19', title: 'Set up monitoring', completed: false }
    ],
    comments: [],
    activityLog: [
      {
        id: 'l15',
        userId: 'u1',
        action: 'CREATE_TASK',
        timestamp: Date.now() - 9 * 24 * 60 * 60 * 1000
      },
      {
        id: 'l16',
        userId: 'u3',
        action: 'CHANGE_STATUS',
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
        fieldName: 'status',
        oldValue: 'TODO',
        newValue: 'IN_PROGRESS'
      }
    ],
    timeSpent: 18000, // 5 hours
    timerStartedAt: null,
    dependsOn: ['t3'],
    tags: ['devops', 'deployment', 'infrastructure'],
    order: 7,
    progress: 50
  },
  {
    id: 't9',
    title: 'Write unit tests',
    description: 'Add comprehensive unit tests for critical business logic. Achieve at least 80% code coverage.',
    projectId: 'p1',
    assignedTo: 'u2',
    createdBy: 'u1',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 12 days from now
    completedAt: null,
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    attachments: [],
    subtasks: [
      { id: 's20', title: 'Set up testing framework', completed: false },
      { id: 's21', title: 'Write tests for authentication', completed: false },
      { id: 's22', title: 'Write tests for task management', completed: false }
    ],
    comments: [],
    activityLog: [
      {
        id: 'l17',
        userId: 'u1',
        action: 'CREATE_TASK',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000
      }
    ],
    timeSpent: 0,
    timerStartedAt: null,
    dependsOn: ['t1'],
    tags: ['testing', 'quality', 'backend'],
    order: 8,
    progress: 0
  },
  {
    id: 't10',
    title: 'Implement dark mode',
    description: 'Add dark mode theme toggle with smooth transitions. Ensure all components support both themes.',
    projectId: 'p1',
    assignedTo: 'u2',
    createdBy: 'u1',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    deadline: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 9 days from now
    completedAt: null,
    status: TaskStatus.TODO,
    priority: Priority.LOW,
    attachments: [],
    subtasks: [],
    comments: [],
    activityLog: [
      {
        id: 'l18',
        userId: 'u1',
        action: 'CREATE_TASK',
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000
      }
    ],
    timeSpent: 0,
    timerStartedAt: null,
    dependsOn: ['t2'],
    tags: ['frontend', 'ui', 'theme'],
    order: 9,
    progress: 0
  }
];

export const INITIAL_SNIPPETS: Snippet[] = [
  {
    id: 'sn1',
    title: 'React Hook Example',
    language: 'typescript',
    code: `import { useState, useEffect } from 'react';

function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue);

  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
}

export default useCounter;`,
    createdBy: 'u2',
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000
  },
  {
    id: 'sn2',
    title: 'Express Rate Limiting Middleware',
    language: 'javascript',
    code: `const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = limiter;`,
    createdBy: 'u3',
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000
  },
  {
    id: 'sn3',
    title: 'PostgreSQL User Task Statistics Query',
    language: 'sql',
    code: `SELECT 
    u.id,
    u.username,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'DONE' THEN 1 END) as completed_tasks
FROM users u
LEFT JOIN tasks t ON u.id = t.assigned_to
GROUP BY u.id, u.username
ORDER BY total_tasks DESC;`,
    createdBy: 'u1',
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000
  },
  {
    id: 'sn4',
    title: 'TypeScript API Client',
    language: 'typescript',
    code: `interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(\`/api/\${endpoint}\`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return { data, status: response.status };
}

export default apiRequest;`,
    createdBy: 'u2',
    timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000
  },
  {
    id: 'sn5',
    title: 'CSS Grid Layout',
    language: 'css',
    code: `.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.grid-item {
  background: var(--bg-card);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}`,
    createdBy: 'u2',
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000
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
