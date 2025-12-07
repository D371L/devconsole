
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Task, Role, Notification, Priority, Snippet, TaskStatus, Project } from '../types';
import { INITIAL_USERS, INITIAL_TASKS, INITIAL_SNIPPETS, ACHIEVEMENTS, INITIAL_PROJECTS } from '../constants';
import { NotificationToast } from '../components/TerminalUI';
import { SoundService } from '../services/soundService';

export type AccentColor = 'cyan' | 'purple' | 'green' | 'amber' | 'pink';

interface AppContextType {
  users: User[];
  tasks: Task[];
  projects: Project[];
  snippets: Snippet[];
  currentUser: User | null;
  theme: 'light' | 'dark';
  accentColor: AccentColor;
  soundEnabled: boolean;
  snakeMode: boolean;
  digitalRainMode: boolean;
  notifications: Notification[];
  toggleTheme: () => void;
  setAccentColor: (color: AccentColor) => void;
  toggleSound: () => void;
  toggleSnakeMode: () => void;
  toggleDigitalRainMode: () => void;
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  addUser: (user: User) => void;
  deleteUser: (id: string) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  addProject: (project: Project) => void;
  addComment: (taskId: string, text: string) => void;
  addSnippet: (snippet: Snippet) => void;
  deleteSnippet: (id: string) => void;
  toggleTaskTimer: (taskId: string) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage or fall back to Constants
  const [users, setUsers] = useState<User[]>(() => {
      const saved = localStorage.getItem('devterm_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  
  const [tasks, setTasks] = useState<Task[]>(() => {
      const saved = localStorage.getItem('devterm_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
      const saved = localStorage.getItem('devterm_projects');
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [snippets, setSnippets] = useState<Snippet[]>(() => {
      const saved = localStorage.getItem('devterm_snippets');
      return saved ? JSON.parse(saved) : INITIAL_SNIPPETS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [accentColor, setAccentColorState] = useState<AccentColor>('cyan');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [snakeMode, setSnakeMode] = useState(false);
  const [digitalRainMode, setDigitalRainMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Persistence Effects (Save on Change)
  useEffect(() => localStorage.setItem('devterm_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('devterm_tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('devterm_projects', JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem('devterm_snippets', JSON.stringify(snippets)), [snippets]);

  // Load Settings
  useEffect(() => {
    const storedUser = localStorage.getItem('devterm_current_user_id');
    if (storedUser) {
        const foundUser = users.find(u => u.id === storedUser);
        if (foundUser) setCurrentUser(foundUser);
    }

    const storedTheme = localStorage.getItem('devterm_theme') as 'light' | 'dark';
    if (storedTheme) setTheme(storedTheme);

    const storedColor = localStorage.getItem('devterm_color') as AccentColor;
    if (storedColor) setAccentColorState(storedColor);

    const storedSound = localStorage.getItem('devterm_sound');
    if (storedSound !== null) setSoundEnabled(storedSound === 'true');
  }, []);

  // Theme Application
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('devterm_theme', theme);
  }, [theme]);

  const setAccentColor = (color: AccentColor) => {
      setAccentColorState(color);
      localStorage.setItem('devterm_color', color);
      SoundService.playClick();
  };

  useEffect(() => {
      SoundService.setMuted(!soundEnabled);
      localStorage.setItem('devterm_sound', String(soundEnabled));
  }, [soundEnabled]);

  // Achievement Logic
  useEffect(() => {
    if (!currentUser) return;

    let hasNewAchievements = false;
    const updatedUser = { ...currentUser };
    let newXp = updatedUser.xp;

    ACHIEVEMENTS.forEach(ach => {
        if (!updatedUser.achievements.includes(ach.id)) {
            if (ach.condition(updatedUser, tasks)) {
                updatedUser.achievements.push(ach.id);
                newXp += ach.xpBonus;
                hasNewAchievements = true;
                showNotification(`ACHIEVEMENT UNLOCKED: ${ach.title} (+${ach.xpBonus} XP)`, 'success');
                SoundService.playSuccess();
            }
        }
    });

    if (hasNewAchievements) {
        updatedUser.xp = newXp;
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }
  }, [tasks, currentUser]); 

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
      const id = Date.now().toString();
      setNotifications(prev => [...prev, { id, message, type }]);
      if (type === 'success') SoundService.playSuccess();
      else if (type === 'error') SoundService.playError();
      else SoundService.playNotification();
  };

  const removeNotification = (id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    SoundService.playClick();
  };

  const toggleSound = () => {
      setSoundEnabled(prev => !prev);
      if (!soundEnabled) { 
          setTimeout(() => SoundService.playClick(), 50);
      }
  };

  const toggleSnakeMode = () => {
      setSnakeMode(prev => !prev);
  }

  const toggleDigitalRainMode = () => {
      setDigitalRainMode(prev => !prev);
      SoundService.playClick();
  }

  const login = (username: string, password?: string): boolean => {
    const user = users.find(u => u.username === username);
    if (user && user.password === password) {
      setCurrentUser(user);
      localStorage.setItem('devterm_current_user_id', user.id);
      showNotification(`Welcome back, ${user.username}`, 'success');
      return true;
    }
    SoundService.playError();
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('devterm_current_user_id');
    showNotification('Logged out successfully', 'info');
  };

  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
    showNotification(`User ${user.username} created`, 'success');
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    showNotification('User deleted', 'info');
  };

  const addTask = (task: Task) => {
    task.activityLog = [{
        id: `l${Date.now()}`,
        userId: currentUser?.id || 'system',
        action: 'Created task',
        timestamp: Date.now()
    }];
    setTasks(prev => [task, ...prev]);
    showNotification('New directive created', 'success');
  };

  const updateTask = (updatedTask: Task) => {
    let xpGained = 0;

    setTasks(prev => prev.map(t => {
        if (t.id === updatedTask.id) {
            const logs = [...(updatedTask.activityLog || [])];
            
            if (t.status !== updatedTask.status) {
                logs.push({
                    id: `l${Date.now()}_s`,
                    userId: currentUser?.id || 'system',
                    action: `Changed status to ${updatedTask.status}`,
                    timestamp: Date.now()
                });

                if (updatedTask.status === TaskStatus.DONE && t.status !== TaskStatus.DONE) {
                    xpGained = 150; 
                    if (t.priority === Priority.HIGH) xpGained += 100;
                    if (t.priority === Priority.CRITICAL) xpGained += 250;
                }
            }
            if (t.priority !== updatedTask.priority) {
                logs.push({
                    id: `l${Date.now()}_p`,
                    userId: currentUser?.id || 'system',
                    action: `Changed priority to ${updatedTask.priority}`,
                    timestamp: Date.now()
                });
            }
             if (t.assignedTo !== updatedTask.assignedTo) {
                 const newAssignee = users.find(u => u.id === updatedTask.assignedTo)?.username || 'Unassigned';
                logs.push({
                    id: `l${Date.now()}_a`,
                    userId: currentUser?.id || 'system',
                    action: `Assigned to ${newAssignee}`,
                    timestamp: Date.now()
                });
            }

            return { ...updatedTask, activityLog: logs };
        }
        return t;
    }));

    if (xpGained > 0 && currentUser) {
        const updatedUser = { ...currentUser, xp: currentUser.xp + xpGained };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        showNotification(`Task Complete! +${xpGained} XP`, 'success');
    }
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    showNotification('Task purged', 'warning');
  };

  const addProject = (project: Project) => {
      setProjects(prev => [...prev, project]);
      showNotification(`Project ${project.name} initialized`, 'success');
  };

  const addComment = (taskId: string, text: string) => {
      setTasks(prev => prev.map(t => {
          if (t.id === taskId) {
              const newComment = {
                  id: `c${Date.now()}`,
                  userId: currentUser?.id || 'system',
                  text,
                  timestamp: Date.now()
              };
              return { ...t, comments: [...t.comments, newComment] };
          }
          return t;
      }));
      SoundService.playClick();
      showNotification('Comment added', 'success');
  };

  const addSnippet = (snippet: Snippet) => {
      setSnippets(prev => [snippet, ...prev]);
      showNotification('Code snippet archived', 'success');
  };

  const deleteSnippet = (id: string) => {
      setSnippets(prev => prev.filter(s => s.id !== id));
      showNotification('Snippet deleted', 'warning');
  };

  const toggleTaskTimer = (taskId: string) => {
      setTasks(prev => prev.map(t => {
          if (t.id === taskId) {
              if (t.timerStartedAt) {
                  const elapsed = (Date.now() - t.timerStartedAt) / 1000;
                  SoundService.playStopTimer();
                  return {
                      ...t,
                      timerStartedAt: null,
                      timeSpent: (t.timeSpent || 0) + elapsed
                  };
              } else {
                  SoundService.playStartTimer();
                  return {
                      ...t,
                      timerStartedAt: Date.now()
                  };
              }
          }
          return t;
      }));
  };

  return (
    <AppContext.Provider value={{
      users,
      tasks,
      projects,
      snippets,
      currentUser,
      theme,
      accentColor,
      soundEnabled,
      snakeMode,
      digitalRainMode,
      notifications,
      toggleTheme,
      setAccentColor,
      toggleSound,
      toggleSnakeMode,
      toggleDigitalRainMode,
      login,
      logout,
      addUser,
      deleteUser,
      addTask,
      updateTask,
      deleteTask,
      addProject,
      addComment,
      addSnippet,
      deleteSnippet,
      toggleTaskTimer,
      showNotification
    }}>
      {children}
      <div aria-live="assertive" className="fixed inset-0 flex items-start justify-center px-4 py-6 pointer-events-none sm:p-6 z-[60]">
          <div className="w-full flex flex-col items-center space-y-4">
              {notifications.map(n => (
                  <NotificationToast key={n.id} message={n.message} type={n.type} onClose={() => removeNotification(n.id)} />
              ))}
          </div>
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
