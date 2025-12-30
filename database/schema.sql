-- PostgreSQL Schema for DevConsole
-- This schema can be used if you want to migrate from LocalStorage to PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'DEVELOPER',
    avatar TEXT,
    xp INTEGER DEFAULT 0,
    achievements TEXT[] DEFAULT '{}',
    allowed_projects TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    project_id VARCHAR(255) REFERENCES projects(id) ON DELETE SET NULL,
    assigned_to VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    created_at BIGINT NOT NULL,
    deadline DATE,
    completed_at BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'TODO',
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    attachments TEXT[] DEFAULT '{}',
    subtasks JSONB DEFAULT '[]',
    comments JSONB DEFAULT '[]',
    activity_log JSONB DEFAULT '[]',
    time_spent INTEGER DEFAULT 0,
    timer_started_at BIGINT,
    depends_on TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    order_index INTEGER DEFAULT 0
);

-- Snippets table
CREATE TABLE IF NOT EXISTS snippets (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_snippets_created_by ON snippets(created_by);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Insert initial data (test users for demo)
INSERT INTO users (id, username, password, role, avatar, xp, achievements) VALUES
    ('u1', 'admin', 'password', 'ADMIN', 'https://api.dicebear.com/9.x/pixel-art/svg?seed=admin_core', 2500, ARRAY['a1', 'a3']::TEXT[]),
    ('u2', 'dev_jane', 'password', 'DEVELOPER', 'https://api.dicebear.com/9.x/pixel-art/svg?seed=jane_dev', 1800, ARRAY['a1', 'a2']::TEXT[]),
    ('u3', 'dev_john', 'password', 'DEVELOPER', 'https://api.dicebear.com/9.x/pixel-art/svg?seed=john_dev', 1200, ARRAY['a1']::TEXT[])
ON CONFLICT (id) DO NOTHING;

-- Insert test projects
INSERT INTO projects (id, name, color, created_at) VALUES
    ('p1', 'Web Platform', '#3B82F6', CURRENT_TIMESTAMP),
    ('p2', 'Mobile App', '#10B981', CURRENT_TIMESTAMP),
    ('p3', 'API Service', '#8B5CF6', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Insert test tasks
INSERT INTO tasks (id, title, description, project_id, assigned_to, created_by, created_at, deadline, completed_at, status, priority, attachments, subtasks, comments, activity_log, time_spent, timer_started_at, depends_on, tags, order_index) VALUES
    ('t1', 'Implement user authentication', 'Set up JWT-based authentication system with login and registration endpoints', 'p1', 'u2', 'u1', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '10 days')) * 1000, (CURRENT_DATE + INTERVAL '5 days')::DATE, NULL, 'IN_PROGRESS', 'HIGH', ARRAY[]::TEXT[], '[]'::jsonb, '[]'::jsonb, '[{"id":"l1","userId":"u1","action":"CREATE_TASK","timestamp":' || (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '10 days')) * 1000)::text || '}]'::jsonb, 14400, NULL, ARRAY[]::TEXT[], ARRAY['backend', 'security', 'auth']::TEXT[], 0),
    ('t2', 'Design dashboard UI', 'Create modern and responsive dashboard interface with task management widgets', 'p1', 'u2', 'u1', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '8 days')) * 1000, (CURRENT_DATE + INTERVAL '3 days')::DATE, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '2 days')) * 1000, 'DONE', 'MEDIUM', ARRAY[]::TEXT[], '[{"id":"s1","title":"Create layout components","completed":true},{"id":"s2","title":"Implement responsive design","completed":true},{"id":"s3","title":"Add interactive widgets","completed":true}]'::jsonb, '[{"id":"c1","userId":"u2","text":"Great progress on the UI design!","timestamp":' || (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '3 days')) * 1000)::text || ',"mentions":[],"reactions":{}}]'::jsonb, '[{"id":"l2","userId":"u1","action":"CREATE_TASK","timestamp":' || (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '8 days')) * 1000)::text || '},{"id":"l3","userId":"u2","action":"CHANGE_STATUS","timestamp":' || (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '5 days')) * 1000)::text || ',"fieldName":"status","oldValue":"TODO","newValue":"IN_PROGRESS"},{"id":"l4","userId":"u2","action":"CHANGE_STATUS","timestamp":' || (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '2 days')) * 1000)::text || ',"fieldName":"status","oldValue":"IN_PROGRESS","newValue":"DONE"}]'::jsonb, 21600, NULL, ARRAY[]::TEXT[], ARRAY['frontend', 'ui', 'design']::TEXT[], 1),
    ('t3', 'Set up CI/CD pipeline', 'Configure GitHub Actions for automated testing and deployment', 'p1', 'u3', 'u1', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '5 days')) * 1000, (CURRENT_DATE + INTERVAL '7 days')::DATE, NULL, 'REVIEW', 'CRITICAL', ARRAY[]::TEXT[], '[{"id":"s4","title":"Configure GitHub Actions","completed":true},{"id":"s5","title":"Set up test suite","completed":true},{"id":"s6","title":"Configure deployment steps","completed":false}]'::jsonb, '[]'::jsonb, '[{"id":"l5","userId":"u1","action":"CREATE_TASK","timestamp":' || (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '5 days')) * 1000)::text || '},{"id":"l6","userId":"u3","action":"CHANGE_STATUS","timestamp":' || (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '2 days')) * 1000)::text || ',"fieldName":"status","oldValue":"TODO","newValue":"IN_PROGRESS"},{"id":"l7","userId":"u3","action":"CHANGE_STATUS","timestamp":' || (EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::text || ',"fieldName":"status","oldValue":"IN_PROGRESS","newValue":"REVIEW"}]'::jsonb, 10800, NULL, ARRAY['t1']::TEXT[], ARRAY['devops', 'ci-cd', 'automation']::TEXT[], 2),
    ('t4', 'Mobile app navigation', 'Implement bottom navigation and drawer menu for mobile application', 'p2', 'u2', 'u1', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '6 days')) * 1000, (CURRENT_DATE + INTERVAL '4 days')::DATE, NULL, 'TODO', 'MEDIUM', ARRAY[]::TEXT[], '[{"id":"s7","title":"Design navigation structure","completed":false},{"id":"s8","title":"Implement bottom nav","completed":false}]'::jsonb, '[]'::jsonb, '[{"id":"l8","userId":"u1","action":"CREATE_TASK","timestamp":' || (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '6 days')) * 1000)::text || '}]'::jsonb, 0, NULL, ARRAY[]::TEXT[], ARRAY['mobile', 'navigation', 'ui']::TEXT[], 3),
    ('t5', 'API rate limiting', 'Implement rate limiting middleware to prevent API abuse', 'p3', 'u3', 'u1', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '4 days')) * 1000, (CURRENT_DATE + INTERVAL '6 days')::DATE, NULL, 'IN_PROGRESS', 'HIGH', ARRAY[]::TEXT[], '[{"id":"s9","title":"Research rate limiting strategies","completed":true},{"id":"s10","title":"Implement middleware","completed":false}]'::jsonb, '[{"id":"c2","userId":"u3","text":"Need to discuss rate limits with @admin","timestamp":' || (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '1 day')) * 1000)::text || ',"mentions":["u1"],"reactions":{}}]'::jsonb, '[{"id":"l9","userId":"u1","action":"CREATE_TASK","timestamp":' || (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '4 days')) * 1000)::text || '},{"id":"l10","userId":"u3","action":"CHANGE_STATUS","timestamp":' || (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '1 day')) * 1000)::text || ',"fieldName":"status","oldValue":"TODO","newValue":"IN_PROGRESS"}]'::jsonb, 5400, NULL, ARRAY[]::TEXT[], ARRAY['backend', 'security', 'api']::TEXT[], 4),
    ('t6', 'Database optimization', 'Optimize database queries and add necessary indexes', 'p3', 'u3', 'u1', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '7 days')) * 1000, (CURRENT_DATE - INTERVAL '2 days')::DATE, NULL, 'BLOCKED', 'MEDIUM', ARRAY[]::TEXT[], '[]'::jsonb, '[{"id":"c3","userId":"u3","text":"Waiting for database access credentials","timestamp":' || (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '3 days')) * 1000)::text || ',"mentions":[],"reactions":{}}]'::jsonb, '[{"id":"l11","userId":"u1","action":"CREATE_TASK","timestamp":' || (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '7 days')) * 1000)::text || '},{"id":"l12","userId":"u3","action":"CHANGE_STATUS","timestamp":' || (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '4 days')) * 1000)::text || ',"fieldName":"status","oldValue":"TODO","newValue":"BLOCKED"}]'::jsonb, 7200, NULL, ARRAY[]::TEXT[], ARRAY['database', 'performance', 'optimization']::TEXT[], 5),
    ('t7', 'User profile page', 'Create user profile page with avatar, stats, and activity history', 'p1', 'u2', 'u1', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '3 days')) * 1000, (CURRENT_DATE + INTERVAL '8 days')::DATE, NULL, 'TODO', 'LOW', ARRAY[]::TEXT[], '[]'::jsonb, '[]'::jsonb, '[{"id":"l13","userId":"u1","action":"CREATE_TASK","timestamp":' || (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '3 days')) * 1000)::text || '}]'::jsonb, 0, NULL, ARRAY['t2']::TEXT[], ARRAY['frontend', 'profile', 'user']::TEXT[], 6)
ON CONFLICT (id) DO NOTHING;

-- Insert test snippets
INSERT INTO snippets (id, title, language, code, created_by, timestamp, created_at) VALUES
    ('sn1', 'React Hook Example', 'typescript', 'import { useState, useEffect } from ''react'';

function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue);

  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
}

export default useCounter;', 'u2', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '5 days')) * 1000, CURRENT_TIMESTAMP),
    ('sn2', 'Express Middleware', 'javascript', 'const rateLimit = require(''express-rate-limit'');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: ''Too many requests from this IP, please try again later.'',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = limiter;', 'u3', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '3 days')) * 1000, CURRENT_TIMESTAMP),
    ('sn3', 'PostgreSQL Query', 'sql', 'SELECT 
    u.id,
    u.username,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = ''DONE'' THEN 1 END) as completed_tasks
FROM users u
LEFT JOIN tasks t ON u.id = t.assigned_to
GROUP BY u.id, u.username
ORDER BY total_tasks DESC;', 'u1', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '2 days')) * 1000, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

