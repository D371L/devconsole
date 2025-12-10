import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'devconsole_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Telegram notification helper
const sendTelegramNotification = async (message) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.warn('Telegram credentials not configured');
    return;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error.message);
    // Don't throw - notifications shouldn't break main functionality
  }
};

const app = express();
const port = process.env.PORT || 8080;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for sensitive endpoints
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.set('trust proxy', 1); // Trust first proxy (Nginx)
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Увеличиваем лимит для больших payload (Base64 attachments)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply rate limiting to all API requests
app.use('/api', limiter);

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Optional auth - allows requests with or without token
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

// Role-based authorization
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database connection
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  // Test connection
  pool.query('SELECT NOW()', (err) => {
    if (err) {
      console.error('Database connection error:', err);
    } else {
      console.log('Database connected successfully');
    }
  });
} catch (error) {
  console.error('Failed to create database pool:', error);
}

// Helper function for database queries
const query = (text, params) => {
  if (!pool) {
    throw new Error('Database not connected');
  }
  return pool.query(text, params);
};

// ========== AUTHENTICATION ROUTES ==========
app.post('/api/auth/login', strictLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    
    // Simple password comparison (in production, use bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        xp: user.xp || 0,
        achievements: user.achievements || [],
        allowedProjects: Array.isArray(user.allowed_projects) ? user.allowed_projects : []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ========== USERS ROUTES ==========
app.get('/api/users', optionalAuth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM users ORDER BY xp DESC');
    res.json(result.rows.map(row => ({
      id: row.id,
      username: row.username,
      password: row.password, // В реальном приложении не возвращать пароль
      role: row.role,
      avatar: row.avatar,
      xp: row.xp || 0,
      achievements: row.achievements || [],
      allowedProjects: Array.isArray(row.allowed_projects) ? row.allowed_projects : (row.allowed_projects ? [row.allowed_projects] : [])
    })));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const row = result.rows[0];
    res.json({
      id: row.id,
      username: row.username,
      password: row.password,
      role: row.role,
      avatar: row.avatar,
      xp: row.xp || 0,
      achievements: row.achievements || [],
      allowedProjects: Array.isArray(row.allowed_projects) ? row.allowed_projects : (row.allowed_projects ? [row.allowed_projects] : [])
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id, username, password, role, avatar, xp, achievements, allowedProjects } = req.body;
    const result = await query(
      `INSERT INTO users (id, username, password, role, avatar, xp, achievements, allowed_projects) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [id, username, password, role || 'DEVELOPER', avatar, xp || 0, achievements || [], allowedProjects || []]
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      username: row.username,
      password: row.password,
      role: row.role,
      avatar: row.avatar,
      xp: row.xp || 0,
      achievements: row.achievements || [],
      allowedProjects: Array.isArray(row.allowed_projects) ? row.allowed_projects : (row.allowed_projects ? [row.allowed_projects] : [])
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, avatar, xp, achievements, allowedProjects } = req.body;
    
    // Check if this is the last admin
    if (role !== 'ADMIN') {
      const currentUserResult = await query('SELECT role FROM users WHERE id = $1', [id]);
      if (currentUserResult.rows[0]?.role === 'ADMIN') {
        const adminCountResult = await query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['ADMIN']);
        if (parseInt(adminCountResult.rows[0].count) <= 1) {
          return res.status(400).json({ error: 'Cannot change role of the last admin' });
        }
      }
    }
    
    const result = await query(
      `UPDATE users SET username = $1, password = $2, role = $3, avatar = $4, xp = $5, achievements = $6, allowed_projects = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [username, password, role, avatar, xp, achievements, allowedProjects || [], id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const row = result.rows[0];
    res.json({
      id: row.id,
      username: row.username,
      password: row.password,
      role: row.role,
      avatar: row.avatar,
      xp: row.xp || 0,
      achievements: row.achievements || [],
      allowedProjects: Array.isArray(row.allowed_projects) ? row.allowed_projects : (row.allowed_projects ? [row.allowed_projects] : [])
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM users WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== PROJECTS ROUTES ==========
app.get('/api/projects', optionalAuth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { id, name, color } = req.body;
    const result = await query(
      'INSERT INTO projects (id, name, color) VALUES ($1, $2, $3) RETURNING *',
      [id, name, color]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== TASKS ROUTES ==========
app.get('/api/tasks', optionalAuth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      projectId: row.project_id,
      assignedTo: row.assigned_to,
      createdBy: row.created_by,
      createdAt: row.created_at,
      deadline: row.deadline,
      completedAt: row.completed_at ? (typeof row.completed_at === 'string' ? parseInt(row.completed_at, 10) : row.completed_at) : null,
      status: row.status,
      priority: row.priority,
      attachments: Array.isArray(row.attachments) ? row.attachments : [],
      subtasks: Array.isArray(row.subtasks) ? row.subtasks : (row.subtasks ? [row.subtasks] : []),
      comments: Array.isArray(row.comments) ? row.comments : (row.comments ? [row.comments] : []),
      activityLog: Array.isArray(row.activity_log) ? row.activity_log : (row.activity_log ? [row.activity_log] : []),
      timeSpent: row.time_spent || 0,
      timerStartedAt: row.timer_started_at,
      dependsOn: Array.isArray(row.depends_on) ? row.depends_on : [],
      tags: Array.isArray(row.tags) ? row.tags : [],
      order: row.order_index || 0
    })));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const row = result.rows[0];
    res.json({
      id: row.id,
      title: row.title,
      description: row.description,
      projectId: row.project_id,
      assignedTo: row.assigned_to,
      createdBy: row.created_by,
      createdAt: row.created_at,
      deadline: row.deadline,
      completedAt: row.completed_at ? (typeof row.completed_at === 'string' ? parseInt(row.completed_at, 10) : row.completed_at) : null,
      status: row.status,
      priority: row.priority,
      attachments: row.attachments || [],
      subtasks: row.subtasks || [],
      comments: row.comments || [],
      activityLog: row.activity_log || [],
      timeSpent: row.time_spent || 0,
      timerStartedAt: row.timer_started_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const task = req.body;
    
    // Валидация и нормализация данных
    // Для text[] нужно убедиться что это массив строк
    const attachments = Array.isArray(task.attachments) ? task.attachments : [];
    
    // Для JSONB полей убеждаемся что это массивы/объекты
    // PostgreSQL требует правильный формат JSON
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : (task.subtasks ? [task.subtasks] : []);
    const comments = Array.isArray(task.comments) ? task.comments : (task.comments ? [task.comments] : []);
    const activityLog = Array.isArray(task.activityLog) ? task.activityLog : (task.activityLog ? [task.activityLog] : []);
    
    // Логируем размер данных для отладки
    const payloadSize = JSON.stringify(task).length;
    if (payloadSize > 10 * 1024 * 1024) { // Больше 10MB
      console.log(`Large payload detected: ${(payloadSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Для JSONB полей сериализуем в JSON строку
    const subtasksJson = JSON.stringify(subtasks);
    const commentsJson = JSON.stringify(comments);
    const activityLogJson = JSON.stringify(activityLog);
    
    // Округляем timeSpent до целого числа (секунды) если это float
    const timeSpent = typeof task.timeSpent === 'number' ? Math.round(task.timeSpent) : (task.timeSpent ? Math.round(parseFloat(task.timeSpent)) : 0);
    
    const dependsOn = Array.isArray(task.dependsOn) ? task.dependsOn : [];
    const tags = Array.isArray(task.tags) ? task.tags : [];
    const orderIndex = task.order || 0;
    
    const result = await query(
      `INSERT INTO tasks (id, title, description, project_id, assigned_to, created_by, created_at, deadline, completed_at, status, priority, attachments, subtasks, comments, activity_log, time_spent, timer_started_at, depends_on, tags, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb, $15::jsonb, $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        task.id,
        task.title,
        task.description,
        task.projectId || null,
        task.assignedTo || null,
        task.createdBy,
        task.createdAt,
        task.deadline || null,
        task.completedAt || null,
        task.status,
        task.priority,
        attachments,              // text[] - массив строк
        subtasksJson,             // jsonb - валидная JSON строка
        commentsJson,             // jsonb - валидная JSON строка
        activityLogJson,          // jsonb - валидная JSON строка
        timeSpent,                // integer - округленное значение
        task.timerStartedAt || null,
        dependsOn,                // text[] - массив ID задач
        tags,                     // text[] - массив тэгов
        orderIndex                // integer - порядок сортировки
      ]
    );
    const row = result.rows[0];
    const createdTask = {
      id: row.id,
      title: row.title,
      description: row.description,
      projectId: row.project_id,
      assignedTo: row.assigned_to,
      createdBy: row.created_by,
      createdAt: row.created_at,
      deadline: row.deadline,
      completedAt: row.completed_at ? (typeof row.completed_at === 'string' ? parseInt(row.completed_at, 10) : row.completed_at) : null,
      status: row.status,
      priority: row.priority,
      attachments: row.attachments || [],
      subtasks: row.subtasks || [],
      comments: row.comments || [],
      activityLog: row.activity_log || [],
      timeSpent: row.time_spent || 0,
      timerStartedAt: row.timer_started_at,
      dependsOn: Array.isArray(row.depends_on) ? row.depends_on : [],
      tags: Array.isArray(row.tags) ? row.tags : [],
      order: row.order_index || 0
    };
    
    // Send Telegram notification for new task
    try {
      const creatorResult = await query('SELECT username FROM users WHERE id = $1', [task.createdBy]);
      const creatorName = creatorResult.rows[0]?.username || 'Unknown';
      
      let message = `📝 *NEW TASK CREATED*\n\n` +
        `Task: *${task.title}*\n` +
        `ID: \`${task.id}\`\n` +
        `Status: ${task.status}\n` +
        `Priority: ${task.priority}\n` +
        `Created by: ${creatorName}\n`;
      
      if (task.assignedTo) {
        const assigneeResult = await query('SELECT username FROM users WHERE id = $1', [task.assignedTo]);
        const assigneeName = assigneeResult.rows[0]?.username || 'Unknown';
        message += `Assigned to: ${assigneeName}\n`;
      }
      
      if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        message += `Deadline: ${deadlineDate.toLocaleDateString()}\n`;
      }
      
      sendTelegramNotification(message).catch(() => {});
    } catch (telegramError) {
      console.error('Failed to send Telegram notification for new task:', telegramError);
    }
    
    res.status(201).json(createdTask);
  } catch (error) {
    console.error('Error creating task:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position
    });
    // Логируем только метаданные задачи, не весь payload (может быть очень большим)
    const taskMeta = {
      id: req.body?.id,
      title: req.body?.title,
      attachmentsCount: Array.isArray(req.body?.attachments) ? req.body.attachments.length : 0,
      subtasksCount: Array.isArray(req.body?.subtasks) ? req.body.subtasks.length : 0,
      payloadSize: JSON.stringify(req.body).length
    };
    console.error('Task metadata:', taskMeta);
    
    res.status(500).json({ 
      error: error.message,
      detail: error.detail || error.hint || 'Check server logs for details'
    });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params; // Сохраняем id вне try блока
  try {
    const task = req.body;
    
    // Валидация и нормализация данных
    // Для text[] нужно убедиться что это массив строк
    const attachments = Array.isArray(task.attachments) ? task.attachments : [];
    
    // Для JSONB полей убеждаемся что это массивы/объекты
    let subtasks = Array.isArray(task.subtasks) ? task.subtasks : (task.subtasks ? [task.subtasks] : []);
    let comments = Array.isArray(task.comments) ? task.comments : (task.comments ? [task.comments] : []);
    let activityLog = Array.isArray(task.activityLog) ? task.activityLog : (task.activityLog ? [task.activityLog] : []);
    
    // Убеждаемся что все элементы массивов валидны
    subtasks = subtasks.filter(item => item != null);
    comments = comments.filter(item => item != null);
    activityLog = activityLog.filter(item => item != null);
    
    // Для JSONB полей используем валидную JSON строку
    const subtasksJson = JSON.stringify(subtasks);
    const commentsJson = JSON.stringify(comments);
    const activityLogJson = JSON.stringify(activityLog);
    
    // Округляем timeSpent до целого числа (секунды) если это float
    const timeSpent = typeof task.timeSpent === 'number' ? Math.round(task.timeSpent) : (task.timeSpent ? Math.round(parseFloat(task.timeSpent)) : 0);
    
    const dependsOn = Array.isArray(task.dependsOn) ? task.dependsOn : [];
    const tags = Array.isArray(task.tags) ? task.tags : [];
    const orderIndex = task.order || 0;
    
    // Get old task data for comparison
    const oldTaskResult = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    const oldTaskRow = oldTaskResult.rows[0] || null;
    
    const result = await query(
      `UPDATE tasks SET 
       title = $1, description = $2, project_id = $3, assigned_to = $4, deadline = $5, completed_at = $6,
       status = $7, priority = $8, attachments = $9, subtasks = $10::jsonb, comments = $11::jsonb, 
       activity_log = $12::jsonb, time_spent = $13, timer_started_at = $14, depends_on = $15, tags = $16, order_index = $17
       WHERE id = $18 RETURNING *`,
      [
        task.title,
        task.description,
        task.projectId || null,
        task.assignedTo || null,
        task.deadline || null,
        task.completedAt || null,
        task.status,
        task.priority,
        attachments,              // text[] - массив строк
        subtasksJson,             // jsonb - валидная JSON строка
        commentsJson,             // jsonb - валидная JSON строка
        activityLogJson,          // jsonb - валидная JSON строка
        timeSpent,                // integer - округленное значение
        task.timerStartedAt || null,
        dependsOn,                // text[] - массив ID задач
        tags,                     // text[] - массив тэгов
        orderIndex,               // integer - порядок сортировки
        id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const row = result.rows[0];
    const updatedTask = {
      id: row.id,
      title: row.title,
      description: row.description,
      projectId: row.project_id,
      assignedTo: row.assigned_to,
      createdBy: row.created_by,
      createdAt: row.created_at,
      deadline: row.deadline,
      completedAt: row.completed_at ? (typeof row.completed_at === 'string' ? parseInt(row.completed_at, 10) : row.completed_at) : null,
      status: row.status,
      priority: row.priority,
      attachments: row.attachments || [],
      subtasks: row.subtasks || [],
      comments: row.comments || [],
      activityLog: row.activity_log || [],
      timeSpent: row.time_spent || 0,
      timerStartedAt: row.timer_started_at,
      dependsOn: Array.isArray(row.depends_on) ? row.depends_on : [],
      tags: Array.isArray(row.tags) ? row.tags : [],
      order: row.order_index || 0
    };
    
    // Send Telegram notification for status changes
    const oldStatus = oldTaskRow?.status;
    
    if (oldStatus && oldStatus !== task.status) {
      // Используем реального пользователя, который обновил задачу (из JWT токена)
      const updatedByUserId = req.user?.id;
      const userResult = updatedByUserId 
        ? await query('SELECT username FROM users WHERE id = $1', [updatedByUserId])
        : { rows: [] };
      const username = userResult.rows[0]?.username || req.user?.username || 'Unknown';
      
      let message = '';
      if (task.status === 'DONE') {
        message = `✅ *TASK COMPLETED*\n\n` +
          `Task: *${task.title}*\n` +
          `ID: \`${task.id}\`\n` +
          `Completed by: ${username}\n`;
      } else {
        message = `📝 *TASK UPDATED*\n\n` +
          `Task: *${task.title}*\n` +
          `ID: \`${task.id}\`\n` +
          `Status: ${oldStatus} → *${task.status}*\n` +
          `Updated by: ${username}\n`;
      }
      sendTelegramNotification(message).catch(() => {});
    } else if (oldStatus && oldTaskRow?.assigned_to !== task.assignedTo && task.assignedTo) {
      const userResult = await query('SELECT username FROM users WHERE id = $1', [task.assignedTo]);
      const username = userResult.rows[0]?.username || 'Unknown';
      const message = `👤 *TASK ASSIGNED*\n\n` +
        `Task: *${task.title}*\n` +
        `ID: \`${task.id}\`\n` +
        `Assigned to: ${username}\n`;
      sendTelegramNotification(message).catch(() => {});
    }
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      taskId: id
    });
    res.status(500).json({ 
      error: error.message,
      detail: error.detail || error.hint || 'Check server logs for details'
    });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM tasks WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to task
app.post('/api/tasks/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, userId } = req.body;
    
    const taskResult = await query('SELECT comments FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = taskResult.rows[0];
    const comments = task.comments || [];
    const newComment = {
      id: `c${Date.now()}`,
      userId,
      text,
      timestamp: Date.now()
    };
    comments.push(newComment);
    
    await query(
      'UPDATE tasks SET comments = $1 WHERE id = $2',
      [JSON.stringify(comments), id]  // jsonb - передаем как JSON строку
    );
    
    // Send notifications for mentions
    if (mentions.length > 0 && task) {
      const commentUserResult = await query('SELECT username FROM users WHERE id = $1', [userId]);
      const commentUser = commentUserResult.rows[0]?.username || 'Unknown';
      
      for (const mentionedUsername of mentions) {
        const mentionedUserResult = await query('SELECT id FROM users WHERE username = $1', [mentionedUsername]);
        if (mentionedUserResult.rows.length > 0) {
          const message = `💬 *MENTION*\n\n` +
            `${mentionedUsername}, you were mentioned in a comment on task *${task.title}*\n\n` +
            `Comment by ${commentUser}: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`;
          sendTelegramNotification(message).catch(() => {});
        }
      }
    }
    
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== SNIPPETS ROUTES ==========
app.get('/api/snippets', optionalAuth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM snippets ORDER BY timestamp DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/snippets', authenticateToken, async (req, res) => {
  try {
    const { id, title, language, code, createdBy, timestamp } = req.body;
    const result = await query(
      'INSERT INTO snippets (id, title, language, code, created_by, timestamp) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, title, language, code, createdBy, timestamp]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/snippets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM snippets WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 DevConsole API server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
});

