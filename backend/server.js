import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

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
      achievements: row.achievements || []
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
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { id, username, password, role, avatar, xp, achievements } = req.body;
    const result = await query(
      `INSERT INTO users (id, username, password, role, avatar, xp, achievements) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [id, username, password, role || 'DEVELOPER', avatar, xp || 0, achievements || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, avatar, xp, achievements } = req.body;
    const result = await query(
      `UPDATE users SET username = $1, password = $2, role = $3, avatar = $4, xp = $5, achievements = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [username, password, role, avatar, xp, achievements, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
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
      status: row.status,
      priority: row.priority,
      attachments: row.attachments || [],
      subtasks: row.subtasks || [],
      comments: row.comments || [],
      activityLog: row.activity_log || [],
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
    const result = await query(
      `INSERT INTO tasks (id, title, description, project_id, assigned_to, created_by, created_at, deadline, status, priority, attachments, subtasks, comments, activity_log, time_spent, timer_started_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        task.id,
        task.title,
        task.description,
        task.projectId,
        task.assignedTo,
        task.createdBy,
        task.createdAt,
        task.deadline,
        task.status,
        task.priority,
        JSON.stringify(task.attachments || []),
        JSON.stringify(task.subtasks || []),
        JSON.stringify(task.comments || []),
        JSON.stringify(task.activityLog || []),
        task.timeSpent || 0,
        task.timerStartedAt
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
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = req.body;
    const result = await query(
      `UPDATE tasks SET 
       title = $1, description = $2, project_id = $3, assigned_to = $4, deadline = $5, 
       status = $6, priority = $7, attachments = $8, subtasks = $9, comments = $10, 
       activity_log = $11, time_spent = $12, timer_started_at = $13
       WHERE id = $14 RETURNING *`,
      [
        task.title,
        task.description,
        task.projectId,
        task.assignedTo,
        task.deadline,
        task.status,
        task.priority,
        JSON.stringify(task.attachments || []),
        JSON.stringify(task.subtasks || []),
        JSON.stringify(task.comments || []),
        JSON.stringify(task.activityLog || []),
        task.timeSpent || 0,
        task.timerStartedAt,
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
    res.status(500).json({ error: error.message });
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
      [JSON.stringify(comments), id]
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

