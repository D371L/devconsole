
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Task, Role, Notification, Priority, Snippet, TaskStatus, Project } from '../types';
import { INITIAL_USERS, INITIAL_TASKS, INITIAL_SNIPPETS, ACHIEVEMENTS, INITIAL_PROJECTS } from '../constants';
import { NotificationToast } from '../components/TerminalUI';
import { SoundService } from '../services/soundService';
import { apiService } from '../services/apiService';

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
  // Check if API is available - check synchronously first to avoid loading from LocalStorage
  const [useAPI, setUseAPI] = useState(false);
  const [apiChecked, setApiChecked] = useState(false);
  const [isCheckingAPI, setIsCheckingAPI] = useState(true);

  // Start with empty arrays if we're checking API, to avoid showing LocalStorage data
  // If API is not available, we'll load from LocalStorage in useEffect
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  // Load data from API only - NO LocalStorage for data
  useEffect(() => {
    const loadData = async () => {
      try {
        await apiService.healthCheck();
        setUseAPI(true);
        // API is available - load data from API only
        try {
          const [apiUsers, apiTasks, apiProjects, apiSnippets] = await Promise.all([
            apiService.getUsers().catch(() => []),
            apiService.getTasks().catch(() => []),
            apiService.getProjects().catch(() => []),
            apiService.getSnippets().catch(() => [])
          ]);
          // Always use API data, even if empty - fallback to INITIAL only if API returns empty
          setUsers(apiUsers.length > 0 ? apiUsers : INITIAL_USERS);
          setTasks(apiTasks);
          setProjects(apiProjects);
          setSnippets(apiSnippets);
        } catch (err) {
          console.error('Failed to load from API:', err);
          // If API fails, use initial constants only (NO LocalStorage)
          setUsers(INITIAL_USERS);
          setTasks(INITIAL_TASKS);
          setProjects(INITIAL_PROJECTS);
          setSnippets(INITIAL_SNIPPETS);
        }
      } catch (error) {
        console.error('API not available:', error);
        setUseAPI(false);
        // API not available - use initial constants only (NO LocalStorage)
        setUsers(INITIAL_USERS);
        setTasks(INITIAL_TASKS);
        setProjects(INITIAL_PROJECTS);
        setSnippets(INITIAL_SNIPPETS);
      } finally {
        setApiChecked(true);
        setIsCheckingAPI(false);
      }
    };
    loadData();
  }, []);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [accentColor, setAccentColorState] = useState<AccentColor>('cyan');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [snakeMode, setSnakeMode] = useState(false);
  const [digitalRainMode, setDigitalRainMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Persistence Effects - API only, NO LocalStorage
  useEffect(() => {
    if (!apiChecked || !useAPI) return;
    // Sync to API in background - NO LocalStorage
    users.forEach(user => {
      apiService.updateUser(user.id, user).catch(err => console.error('Failed to sync user:', err));
    });
  }, [users, useAPI, apiChecked]);

  useEffect(() => {
    if (!apiChecked || !useAPI) return;
    // Sync to API in background - NO LocalStorage
    tasks.forEach(task => {
      apiService.updateTask(task.id, task).catch(err => console.error('Failed to sync task:', err));
    });
  }, [tasks, useAPI, apiChecked]);

  // Load Settings - NO LocalStorage, use defaults only
  // Settings are not persisted, always use defaults

  // Theme Application - NO LocalStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // NO LocalStorage - settings are not persisted
  }, [theme]);

  const setAccentColor = (color: AccentColor) => {
      setAccentColorState(color);
      // NO LocalStorage - settings are not persisted
      SoundService.playClick();
  };

  useEffect(() => {
      SoundService.setMuted(!soundEnabled);
      // NO LocalStorage - settings are not persisted
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
      // NO LocalStorage - current user is not persisted
      showNotification(`Welcome back, ${user.username}`, 'success');
      return true;
    }
    SoundService.playError();
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    // NO LocalStorage - current user is not persisted
    showNotification('Logged out successfully', 'info');
  };

  const addUser = async (user: User) => {
    try {
      if (useAPI && apiChecked) {
        await apiService.createUser(user);
      }
      setUsers(prev => [...prev, user]);
      showNotification(`User ${user.username} created`, 'success');
    } catch (error) {
      console.error('Failed to create user:', error);
      setUsers(prev => [...prev, user]); // Still add locally
      showNotification(`User ${user.username} created (local)`, 'success');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      if (useAPI && apiChecked) {
        await apiService.deleteUser(id);
      }
      setUsers(prev => prev.filter(u => u.id !== id));
      showNotification('User deleted', 'info');
    } catch (error) {
      console.error('Failed to delete user:', error);
      setUsers(prev => prev.filter(u => u.id !== id));
      showNotification('User deleted (local)', 'info');
    }
  };

  const addTask = async (task: Task) => {
    task.activityLog = [{
        id: `l${Date.now()}`,
        userId: currentUser?.id || 'system',
        action: 'Created task',
        timestamp: Date.now()
    }];
    try {
      if (useAPI && apiChecked) {
        await apiService.createTask(task);
      }
      setTasks(prev => [task, ...prev]);
      showNotification('New directive created', 'success');
    } catch (error) {
      console.error('Failed to create task:', error);
      setTasks(prev => [task, ...prev]);
      showNotification('New directive created (local)', 'success');
    }
  };

  const updateTask = async (updatedTask: Task) => {
    let xpGained = 0;

    try {
      if (useAPI && apiChecked) {
        await apiService.updateTask(updatedTask.id, updatedTask);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }

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

  const deleteTask = async (id: string) => {
    try {
      if (useAPI && apiChecked) {
        await apiService.deleteTask(id);
      }
      setTasks(prev => prev.filter(t => t.id !== id));
      showNotification('Task purged', 'warning');
    } catch (error) {
      console.error('Failed to delete task:', error);
      setTasks(prev => prev.filter(t => t.id !== id));
      showNotification('Task purged (local)', 'warning');
    }
  };

  const addProject = async (project: Project) => {
      try {
        if (useAPI && apiChecked) {
          await apiService.createProject(project);
        }
        setProjects(prev => [...prev, project]);
        showNotification(`Project ${project.name} initialized`, 'success');
      } catch (error) {
        console.error('Failed to create project:', error);
        setProjects(prev => [...prev, project]);
        showNotification(`Project ${project.name} initialized (local)`, 'success');
      }
  };

  const addComment = async (taskId: string, text: string) => {
      try {
        if (useAPI && apiChecked && currentUser) {
          await apiService.addComment(taskId, text, currentUser.id);
        }
      } catch (error) {
        console.error('Failed to add comment:', error);
      }
      
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

  const addSnippet = async (snippet: Snippet) => {
      try {
        if (useAPI && apiChecked) {
          await apiService.createSnippet(snippet);
        }
        setSnippets(prev => [snippet, ...prev]);
        showNotification('Code snippet archived', 'success');
      } catch (error) {
        console.error('Failed to create snippet:', error);
        setSnippets(prev => [snippet, ...prev]);
        showNotification('Code snippet archived (local)', 'success');
      }
  };

  const deleteSnippet = async (id: string) => {
      try {
        if (useAPI && apiChecked) {
          await apiService.deleteSnippet(id);
        }
        setSnippets(prev => prev.filter(s => s.id !== id));
        showNotification('Snippet deleted', 'warning');
      } catch (error) {
        console.error('Failed to delete snippet:', error);
        setSnippets(prev => prev.filter(s => s.id !== id));
        showNotification('Snippet deleted (local)', 'warning');
      }
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
