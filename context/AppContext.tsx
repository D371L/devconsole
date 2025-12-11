
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  addProject: (project: Project) => void;
  addComment: (taskId: string, text: string) => void;
  editComment: (taskId: string, commentId: string, newText: string) => void;
  deleteComment: (taskId: string, commentId: string) => void;
  addReaction: (taskId: string, commentId: string, emoji: string) => void;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Фильтрованные данные для VIEWER (используем useMemo для правильной реактивности)
  const tasks = useMemo(() => {
    return currentUser?.role === Role.VIEWER && currentUser.allowedProjects
      ? allTasks.filter(task => currentUser.allowedProjects!.includes(task.projectId))
      : allTasks;
  }, [allTasks, currentUser]);
  
  const projects = useMemo(() => {
    return currentUser?.role === Role.VIEWER && currentUser.allowedProjects
      ? allProjects.filter(project => currentUser.allowedProjects!.includes(project.id))
      : allProjects;
  }, [allProjects, currentUser]);

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

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning') => {
      const id = Date.now().toString();
      setNotifications(prev => [...prev, { id, message, type }]);
      if (type === 'success') SoundService.playSuccess();
      else if (type === 'error') SoundService.playError();
      else SoundService.playNotification();
  }, []);

  const removeNotification = useCallback((id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    SoundService.playClick();
  }, []);

  const toggleSound = useCallback(() => {
      setSoundEnabled(prev => {
          if (!prev) { 
              setTimeout(() => SoundService.playClick(), 50);
          }
          return !prev;
      });
  }, []);

  const toggleSnakeMode = useCallback(() => {
      setSnakeMode(prev => !prev);
  }, []);

  const toggleDigitalRainMode = useCallback(() => {
      setDigitalRainMode(prev => !prev);
      SoundService.playClick();
  }, []);

  const login = async (username: string, password?: string): Promise<boolean> => {
    try {
      // Try API login first
      if (useAPI && apiChecked) {
        try {
          const response = await apiService.login(username, password || '');
          setCurrentUser(response.user);
          setUsers(prev => {
            const existing = prev.find(u => u.id === response.user.id);
            if (existing) {
              return prev.map(u => u.id === response.user.id ? response.user : u);
            }
            return [...prev, response.user];
          });
          
          const welcomeShown = sessionStorage.getItem('devconsole_welcome_shown');
          if (!welcomeShown) {
            showNotification(`Welcome back, ${response.user.username}`, 'success');
            sessionStorage.setItem('devconsole_welcome_shown', 'true');
          }
          return true;
        } catch (error) {
          console.error('API login failed:', error);
          // Fall through to local login
        }
      }
      
      // Fallback to local login (for demo/offline mode)
      const user = users.find(u => u.username === username);
      if (user && user.password === password) {
        setCurrentUser(user);
        const welcomeShown = sessionStorage.getItem('devconsole_welcome_shown');
        if (!welcomeShown) {
          showNotification(`Welcome back, ${user.username}`, 'success');
          sessionStorage.setItem('devconsole_welcome_shown', 'true');
        }
        return true;
      }
      
      SoundService.playError();
      return false;
    } catch (error) {
      console.error('Login error:', error);
      SoundService.playError();
      return false;
    }
  };

  const logout = () => {
    if (useAPI && apiChecked) {
      apiService.clearAuthToken();
    }
    setCurrentUser(null);
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

  const updateUser = async (user: User) => {
    try {
      if (useAPI && apiChecked) {
        await apiService.updateUser(user);
      }
      setUsers(prev => prev.map(u => u.id === user.id ? user : u));
      showNotification(`User ${user.username} updated`, 'success');
    } catch (error) {
      console.error('Failed to update user:', error);
      setUsers(prev => prev.map(u => u.id === user.id ? user : u));
      showNotification(`User ${user.username} updated (local)`, 'success');
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

  // Helper function to calculate task progress from subtasks
  const calculateTaskProgress = useCallback((subtasks: Subtask[]): number => {
    if (!subtasks || subtasks.length === 0) return 0;
    const completed = subtasks.filter(st => st.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  }, []);

  const updateTask = async (updatedTask: Task) => {
    let xpGained = 0;

    // Calculate progress from subtasks
    const subtasks = updatedTask.subtasks || [];
    updatedTask.progress = calculateTaskProgress(subtasks);

    // Убеждаемся что activityLog это массив
    const currentTask = tasks.find(t => t.id === updatedTask.id);
    const existingLogs = Array.isArray(updatedTask.activityLog) ? [...updatedTask.activityLog] : (Array.isArray(currentTask?.activityLog) ? [...currentTask.activityLog] : []);
    const logs = [...existingLogs];
    
    // Helper function to track field changes
    const trackFieldChange = (fieldName: string, oldValue: any, newValue: any, action: string) => {
      // Skip if values are the same
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
      
      logs.push({
        id: `l${Date.now()}_${fieldName}_${Math.random().toString(36).substr(2, 9)}`,
        userId: currentUser?.id || 'system',
        action: action,
        timestamp: Date.now(),
        fieldName: fieldName,
        oldValue: oldValue,
        newValue: newValue
      });
    };

    // Helper to format value for display
    const formatValue = (value: any, fieldName: string): string => {
      if (value === null || value === undefined || value === '') return '(empty)';
      if (fieldName === 'assignedTo') {
        const user = users.find(u => u.id === value);
        return user ? user.username : 'Unassigned';
      }
      if (fieldName === 'projectId') {
        const project = projects.find(p => p.id === value);
        return project ? project.name : value;
      }
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : '(empty)';
      }
      if (typeof value === 'number' && fieldName === 'deadline') {
        return new Date(value).toLocaleDateString();
      }
      return String(value);
    };
    
    if (currentTask) {
        // Track title changes
        if (currentTask.title !== updatedTask.title) {
          trackFieldChange('title', currentTask.title, updatedTask.title, `Changed title from "${currentTask.title}" to "${updatedTask.title}"`);
        }

        // Track description changes (only if significantly different)
        if (currentTask.description !== updatedTask.description) {
          const oldDesc = currentTask.description || '(empty)';
          const newDesc = updatedTask.description || '(empty)';
          trackFieldChange('description', oldDesc, newDesc, 'Updated description');
        }

        // Track status changes
        if (currentTask.status !== updatedTask.status) {
          trackFieldChange('status', currentTask.status, updatedTask.status, `Changed status from ${currentTask.status} to ${updatedTask.status}`);

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

        // Track priority changes
        if (currentTask.priority !== updatedTask.priority) {
          trackFieldChange('priority', currentTask.priority, updatedTask.priority, `Changed priority from ${currentTask.priority} to ${updatedTask.priority}`);
        }

        // Track assignment changes
        if (currentTask.assignedTo !== updatedTask.assignedTo) {
          const oldAssignee = currentTask.assignedTo ? users.find(u => u.id === currentTask.assignedTo)?.username || currentTask.assignedTo : 'Unassigned';
          const newAssignee = updatedTask.assignedTo ? users.find(u => u.id === updatedTask.assignedTo)?.username || updatedTask.assignedTo : 'Unassigned';
          trackFieldChange('assignedTo', oldAssignee, newAssignee, `Reassigned from ${oldAssignee} to ${newAssignee}`);
        }

        // Track deadline changes
        if (currentTask.deadline !== updatedTask.deadline) {
          const oldDeadline = currentTask.deadline ? new Date(currentTask.deadline).toLocaleDateString() : '(no deadline)';
          const newDeadline = updatedTask.deadline ? new Date(updatedTask.deadline).toLocaleDateString() : '(no deadline)';
          trackFieldChange('deadline', oldDeadline, newDeadline, `Changed deadline from ${oldDeadline} to ${newDeadline}`);
        }

        // Track project changes
        if (currentTask.projectId !== updatedTask.projectId) {
          const oldProject = currentTask.projectId ? projects.find(p => p.id === currentTask.projectId)?.name || currentTask.projectId : '(no project)';
          const newProject = updatedTask.projectId ? projects.find(p => p.id === updatedTask.projectId)?.name || updatedTask.projectId : '(no project)';
          trackFieldChange('projectId', oldProject, newProject, `Changed project from ${oldProject} to ${newProject}`);
        }

        // Track tags changes
        const oldTags = currentTask.tags || [];
        const newTags = updatedTask.tags || [];
        if (JSON.stringify(oldTags.sort()) !== JSON.stringify(newTags.sort())) {
          trackFieldChange('tags', oldTags, newTags, `Updated tags: ${oldTags.length > 0 ? oldTags.join(', ') : '(none)'} → ${newTags.length > 0 ? newTags.join(', ') : '(none)'}`);
        }

        // Track dependencies changes
        const oldDependsOn = currentTask.dependsOn || [];
        const newDependsOn = updatedTask.dependsOn || [];
        if (JSON.stringify(oldDependsOn.sort()) !== JSON.stringify(newDependsOn.sort())) {
          trackFieldChange('dependsOn', oldDependsOn, newDependsOn, `Updated dependencies: ${oldDependsOn.length} → ${newDependsOn.length}`);
        }

        // Track subtasks changes (check if completed count changed)
        const oldCompletedSubtasks = (currentTask.subtasks || []).filter(st => st.completed).length;
        const newCompletedSubtasks = (updatedTask.subtasks || []).filter(st => st.completed).length;
        const oldTotalSubtasks = (currentTask.subtasks || []).length;
        const newTotalSubtasks = (updatedTask.subtasks || []).length;
        if (oldCompletedSubtasks !== newCompletedSubtasks || oldTotalSubtasks !== newTotalSubtasks) {
          trackFieldChange('subtasks', `${oldCompletedSubtasks}/${oldTotalSubtasks}`, `${newCompletedSubtasks}/${newTotalSubtasks}`, `Updated subtasks progress: ${oldCompletedSubtasks}/${oldTotalSubtasks} → ${newCompletedSubtasks}/${newTotalSubtasks}`);
        }

        // Track attachments changes (only count)
        const oldAttachmentsCount = (currentTask.attachments || []).length;
        const newAttachmentsCount = (updatedTask.attachments || []).length;
        if (oldAttachmentsCount !== newAttachmentsCount) {
          trackFieldChange('attachments', oldAttachmentsCount, newAttachmentsCount, `Updated attachments: ${oldAttachmentsCount} → ${newAttachmentsCount} files`);
        }
    }

    // Объединяем обновленную задачу с логами
    const taskWithLogs = { ...updatedTask, activityLog: logs };

    try {
      if (useAPI && apiChecked) {
        const savedTask = await apiService.updateTask(updatedTask.id, taskWithLogs);
        // Используем задачу, возвращенную с сервера, чтобы гарантировать синхронизацию
        setAllTasks(prev => prev.map(t => t.id === updatedTask.id ? savedTask : t));
        return savedTask; // Return saved task for promise resolution
      } else {
        setAllTasks(prev => prev.map(t => t.id === updatedTask.id ? taskWithLogs : t));
        return taskWithLogs; // Return updated task for promise resolution
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      // В случае ошибки все равно обновляем локально
      setAllTasks(prev => prev.map(t => t.id === updatedTask.id ? taskWithLogs : t));
      throw error; // Re-throw error so caller can handle it
    }

    if (xpGained > 0 && currentUser) {
        let updatedUser = { ...currentUser, xp: currentUser.xp + xpGained };
        
        // Check for new achievements
        let hasNewAchievements = false;
        const shownAchievements = JSON.parse(sessionStorage.getItem('devconsole_shown_achievements') || '[]');
        
        ACHIEVEMENTS.forEach(ach => {
            if (!updatedUser.achievements.includes(ach.id)) {
                if (ach.condition(updatedUser, tasks)) {
                    updatedUser.achievements.push(ach.id);
                    updatedUser.xp += ach.xpBonus;
                    hasNewAchievements = true;
                    
                    if (!shownAchievements.includes(ach.id)) {
                        showNotification(`ACHIEVEMENT UNLOCKED: ${ach.title} ${ach.icon} +${ach.xpBonus} XP`, 'success');
                        shownAchievements.push(ach.id);
                        sessionStorage.setItem('devconsole_shown_achievements', JSON.stringify(shownAchievements));
                    }
                }
            }
        });
        
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        
        // Update user in API
        try {
            if (useAPI && apiChecked) {
                await apiService.updateUser(updatedUser);
            }
        } catch (error) {
            console.error('Failed to update user achievements:', error);
        }
        
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
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to delete task:', error);
      // Don't remove locally if API delete failed - let user retry
      throw error; // Re-throw error so caller can handle it
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

  // Helper function to parse @username mentions from text
  const parseMentions = useCallback((text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (user && !mentions.includes(user.id)) {
        mentions.push(user.id);
      }
    }
    return mentions;
  }, [users]);

  const addComment = async (taskId: string, text: string) => {
      const mentions = parseMentions(text);
      const newComment = {
          id: `c${Date.now()}`,
          userId: currentUser?.id || 'system',
          text,
          timestamp: Date.now(),
          mentions: mentions.length > 0 ? mentions : undefined,
          reactions: {}
      };
      
      try {
        if (useAPI && apiChecked && currentUser) {
          await apiService.addComment(taskId, text, currentUser.id, mentions);
        }
      } catch (error) {
        console.error('Failed to add comment:', error);
      }
      
      setAllTasks(prev => prev.map(t => {
          if (t.id === taskId) {
              return { ...t, comments: [...t.comments, newComment] };
          }
          return t;
      }));
      SoundService.playClick();
      showNotification('Comment added', 'success');
  };

  const editComment = async (taskId: string, commentId: string, newText: string) => {
      const mentions = parseMentions(newText);
      
      try {
        if (useAPI && apiChecked) {
          await apiService.editComment(taskId, commentId, newText, mentions);
        }
      } catch (error) {
        console.error('Failed to edit comment:', error);
      }
      
      setAllTasks(prev => prev.map(t => {
          if (t.id === taskId) {
              const updatedComments = t.comments.map(c => 
                  c.id === commentId 
                      ? { ...c, text: newText, mentions: mentions.length > 0 ? mentions : c.mentions, edited: true, editedAt: Date.now() }
                      : c
              );
              return { ...t, comments: updatedComments };
          }
          return t;
      }));
      SoundService.playClick();
      showNotification('Comment updated', 'success');
  };

  const deleteComment = async (taskId: string, commentId: string) => {
      if (!window.confirm('Delete this comment?')) return;
      
      try {
        if (useAPI && apiChecked) {
          await apiService.deleteComment(taskId, commentId);
        }
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
      
      setAllTasks(prev => prev.map(t => {
          if (t.id === taskId) {
              return { ...t, comments: t.comments.filter(c => c.id !== commentId) };
          }
          return t;
      }));
      SoundService.playClick();
      showNotification('Comment deleted', 'info');
  };

  const addReaction = async (taskId: string, commentId: string, emoji: string) => {
      const userId = currentUser?.id || 'system';
      
      try {
        if (useAPI && apiChecked) {
          await apiService.addReaction(taskId, commentId, emoji);
        }
      } catch (error) {
        console.error('Failed to add reaction:', error);
      }
      
      setAllTasks(prev => prev.map(t => {
          if (t.id === taskId) {
              const updatedComments = t.comments.map(c => {
                  if (c.id === commentId) {
                      const reactions = c.reactions || {};
                      const emojiReactions = reactions[emoji] || [];
                      const hasReacted = emojiReactions.includes(userId);
                      
                      const newReactions = { ...reactions };
                      if (hasReacted) {
                          // Remove reaction
                          newReactions[emoji] = emojiReactions.filter(id => id !== userId);
                          if (newReactions[emoji].length === 0) {
                              delete newReactions[emoji];
                          }
                      } else {
                          // Add reaction
                          newReactions[emoji] = [...emojiReactions, userId];
                      }
                      
                      return { ...c, reactions: newReactions };
                  }
                  return c;
              });
              return { ...t, comments: updatedComments };
          }
          return t;
      }));
      SoundService.playClick();
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
    updateUser,
    deleteUser,
      addTask,
      updateTask,
      deleteTask,
      addProject,
      addComment,
      editComment,
      deleteComment,
      addReaction,
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
