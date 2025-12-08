import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Увеличиваем лимит для больших payload (Base64 attachments)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
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

// ========== USERS ROUTES ==========
app.get('/api/users', async (req, res) => {
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

app.get('/api/users/:id', async (req, res) => {
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

app.post('/api/users', async (req, res) => {
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

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, avatar, xp, achievements, allowedProjects } = req.body;
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

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM users WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== PROJECTS ROUTES ==========
app.get('/api/projects', async (req, res) => {
  try {
    const result = await query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
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
app.get('/api/tasks', async (req, res) => {
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
      timerStartedAt: row.timer_started_at
    })));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
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

app.post('/api/tasks', async (req, res) => {
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
    
    const result = await query(
      `INSERT INTO tasks (id, title, description, project_id, assigned_to, created_by, created_at, deadline, completed_at, status, priority, attachments, subtasks, comments, activity_log, time_spent, timer_started_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb, $15::jsonb, $16, $17)
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
        task.timerStartedAt || null
      ]
    );
    const row = result.rows[0];
    res.status(201).json({
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

app.put('/api/tasks/:id', async (req, res) => {
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
    
    const result = await query(
      `UPDATE tasks SET 
       title = $1, description = $2, project_id = $3, assigned_to = $4, deadline = $5, completed_at = $6,
       status = $7, priority = $8, attachments = $9, subtasks = $10::jsonb, comments = $11::jsonb, 
       activity_log = $12::jsonb, time_spent = $13, timer_started_at = $14
       WHERE id = $15 RETURNING *`,
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
        id
      ]
    );
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

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM tasks WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to task
app.post('/api/tasks/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, userId } = req.body;
    
    const taskResult = await query('SELECT comments FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const comments = taskResult.rows[0].comments || [];
    const newComment = {
      id: `c${Date.now()}`,
      userId,
      text,
      timestamp: Date.now()
    };
    comments.push(newComment);
    
    await query(
      'UPDATE tasks SET comments = $1 WHERE id = $2',
      [comments, id]  // jsonb - передаем массив напрямую
    );
    
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== SNIPPETS ROUTES ==========
app.get('/api/snippets', async (req, res) => {
  try {
    const result = await query('SELECT * FROM snippets ORDER BY timestamp DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/snippets', async (req, res) => {
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

app.delete('/api/snippets/:id', async (req, res) => {
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

