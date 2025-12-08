
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
  toggleTaskTimer: (taskId: string) => Promise<void>;
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
  const [allTasks, setAllTasks] = useState<Task[]>([]); // Все задачи (без фильтрации)
  const [allProjects, setAllProjects] = useState<Project[]>([]); // Все проекты (без фильтрации)
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  
  // Фильтрованные данные для VIEWER
  const tasks = currentUser?.role === Role.VIEWER && currentUser.allowedProjects
    ? allTasks.filter(task => currentUser.allowedProjects!.includes(task.projectId))
    : allTasks;
  
  const projects = currentUser?.role === Role.VIEWER && currentUser.allowedProjects
    ? allProjects.filter(project => currentUser.allowedProjects!.includes(project.id))
    : allProjects;

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
          // Always use API data ONLY - no fallback to INITIAL
          // If API returns empty, use empty arrays (fresh start)
          setUsers(apiUsers.length > 0 ? apiUsers : INITIAL_USERS);
          setAllTasks(apiTasks.length > 0 ? apiTasks : []);
          setAllProjects(apiProjects.length > 0 ? apiProjects : []);
          setSnippets(apiSnippets.length > 0 ? apiSnippets : []);
        } catch (err) {
          console.error('Failed to load from API:', err);
          // If API fails, use INITIAL_USERS only (for admin), empty for rest
          setUsers(INITIAL_USERS);
          setAllTasks([]);
          setAllProjects([]);
          setSnippets([]);
        }
      } catch (error) {
        console.error('API not available:', error);
        setUseAPI(false);
        // API not available - use INITIAL_USERS only (for admin), empty for rest
        setUsers(INITIAL_USERS);
        setAllTasks([]);
        setAllProjects([]);
        setSnippets([]);
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

  // Note: Users and tasks are saved individually when created/updated via their respective functions
  // No bulk sync needed here to avoid infinite loops and unnecessary API calls

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

    // Получаем список уже показанных достижений из sessionStorage
    const shownAchievements = JSON.parse(sessionStorage.getItem('devconsole_shown_achievements') || '[]');

    ACHIEVEMENTS.forEach(ach => {
        if (!updatedUser.achievements.includes(ach.id)) {
            if (ach.condition(updatedUser, tasks)) {
                updatedUser.achievements.push(ach.id);
                newXp += ach.xpBonus;
                hasNewAchievements = true;
                
                // Показываем уведомление только если это достижение еще не было показано в этой сессии
                if (!shownAchievements.includes(ach.id)) {
                    showNotification(`ACHIEVEMENT UNLOCKED: ${ach.title} (+${ach.xpBonus} XP)`, 'success');
                    SoundService.playSuccess();
                    shownAchievements.push(ach.id);
                    sessionStorage.setItem('devconsole_shown_achievements', JSON.stringify(shownAchievements));
                }
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
      // Показываем приветствие только один раз (используем sessionStorage)
      const welcomeShown = sessionStorage.getItem('devconsole_welcome_shown');
      if (!welcomeShown) {
        showNotification(`Welcome back, ${user.username}`, 'success');
        sessionStorage.setItem('devconsole_welcome_shown', 'true');
      }
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
        console.log('Creating task via API:', task);
        const createdTask = await apiService.createTask(task);
        console.log('Task created successfully:', createdTask);
        setAllTasks(prev => [createdTask, ...prev]);
        showNotification('New directive created', 'success');
      } else {
        console.warn('API not available, task not saved to database');
        setAllTasks(prev => [task, ...prev]);
        showNotification('New directive created (local only)', 'warning');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      console.error('Task that failed:', task);
      // Не добавляем задачу в состояние если она не сохранилась в базу
      showNotification('Failed to create task: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  };

  const updateTask = async (updatedTask: Task) => {
    let xpGained = 0;

    // Убеждаемся что activityLog это массив
    const currentTask = tasks.find(t => t.id === updatedTask.id);
    const existingLogs = Array.isArray(updatedTask.activityLog) ? [...updatedTask.activityLog] : (Array.isArray(currentTask?.activityLog) ? [...currentTask.activityLog] : []);
    const logs = [...existingLogs];
    
    if (currentTask) {
        if (currentTask.status !== updatedTask.status) {
            logs.push({
                id: `l${Date.now()}_s`,
                userId: currentUser?.id || 'system',
                action: `Changed status to ${updatedTask.status}`,
                timestamp: Date.now()
            });

            if (updatedTask.status === TaskStatus.DONE && currentTask.status !== TaskStatus.DONE) {
                // Устанавливаем дату завершения при изменении статуса на DONE
                updatedTask.completedAt = Date.now();
                xpGained = 150; 
                if (currentTask.priority === Priority.HIGH) xpGained += 100;
                if (currentTask.priority === Priority.CRITICAL) xpGained += 250;
            } else if (updatedTask.status !== TaskStatus.DONE && currentTask.status === TaskStatus.DONE) {
                // Очищаем дату завершения если статус изменился с DONE на другой
                updatedTask.completedAt = null;
            }
        }
        if (currentTask.priority !== updatedTask.priority) {
            logs.push({
                id: `l${Date.now()}_p`,
                userId: currentUser?.id || 'system',
                action: `Changed priority to ${updatedTask.priority}`,
                timestamp: Date.now()
            });
        }
        if (currentTask.assignedTo !== updatedTask.assignedTo) {
            const newAssignee = users.find(u => u.id === updatedTask.assignedTo)?.username || 'Unassigned';
            logs.push({
                id: `l${Date.now()}_a`,
                userId: currentUser?.id || 'system',
                action: `Assigned to ${newAssignee}`,
                timestamp: Date.now()
            });
        }
    }

    // Объединяем обновленную задачу с логами
    const taskWithLogs = { ...updatedTask, activityLog: logs };

    try {
      if (useAPI && apiChecked) {
        await apiService.updateTask(updatedTask.id, taskWithLogs);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }

    setAllTasks(prev => prev.map(t => t.id === updatedTask.id ? taskWithLogs : t));

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
      setAllTasks(prev => prev.filter(t => t.id !== id));
      showNotification('Task purged', 'warning');
    } catch (error) {
      console.error('Failed to delete task:', error);
      setAllTasks(prev => prev.filter(t => t.id !== id));
      showNotification('Task purged (local)', 'warning');
    }
  };

  const addProject = async (project: Project) => {
      try {
        if (useAPI && apiChecked) {
          await apiService.createProject(project);
        }
        setAllProjects(prev => [...prev, project]);
        showNotification(`Project ${project.name} initialized`, 'success');
      } catch (error) {
        console.error('Failed to create project:', error);
        setAllProjects(prev => [...prev, project]);
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
      
      setAllTasks(prev => prev.map(t => {
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

  const toggleTaskTimer = async (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
          console.error('Task not found:', taskId);
          return;
      }

      // Правильная проверка timerStartedAt (может быть number, null, или строка)
      const timerStartedAt = typeof task.timerStartedAt === 'string' 
        ? (task.timerStartedAt === 'null' || task.timerStartedAt === '' ? null : parseInt(task.timerStartedAt, 10))
        : task.timerStartedAt;
      
      const isTimerActive = timerStartedAt != null && !isNaN(timerStartedAt) && timerStartedAt > 0;
      
      // Подготовка activityLog
      const activityLog = Array.isArray(task.activityLog) ? [...task.activityLog] : [];
      
      let updatedTask: Task;
      
      if (isTimerActive) {
          // Останавливаем таймер - добавляем прошедшее время к timeSpent
          const elapsed = (Date.now() - timerStartedAt!) / 1000;
          const elapsedMinutes = Math.floor(elapsed / 60);
          const elapsedSeconds = Math.floor(elapsed % 60);
          SoundService.playStopTimer();
          
          // Добавляем лог об остановке таймера
          activityLog.push({
              id: `l${Date.now()}_timer_stop`,
              userId: currentUser?.id || 'system',
              action: `Stopped timer (tracked ${elapsedMinutes}m ${elapsedSeconds}s)`,
              timestamp: Date.now()
          });
          
          updatedTask = {
              ...task,
              timerStartedAt: null,
              timeSpent: Math.round((task.timeSpent || 0) + elapsed),
              activityLog: activityLog
          };
          console.log('Stopping timer. Elapsed:', elapsed, 'Total time:', updatedTask.timeSpent);
      } else {
          // Запускаем таймер
          SoundService.playStartTimer();
          
          // Добавляем лог о запуске таймера
          activityLog.push({
              id: `l${Date.now()}_timer_start`,
              userId: currentUser?.id || 'system',
              action: 'Started time tracking',
              timestamp: Date.now()
          });
          
          updatedTask = {
              ...task,
              timerStartedAt: Date.now(),
              activityLog: activityLog
          };
          console.log('Starting timer at:', updatedTask.timerStartedAt);
      }
      
      // Сначала обновляем локальное состояние для мгновенной реакции UI
          setAllTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      
      // Затем сохраняем в базу данных
      try {
          if (useAPI && apiChecked) {
              await apiService.updateTask(taskId, updatedTask);
              console.log('Timer state saved to database');
          }
      } catch (error) {
          console.error('Failed to save timer:', error);
          showNotification('Failed to save timer', 'error');
          // Откатываем изменение при ошибке
          setAllTasks(prev => prev.map(t => t.id === taskId ? task : t));
      }
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
