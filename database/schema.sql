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
    status VARCHAR(50) NOT NULL DEFAULT 'TODO',
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    attachments TEXT[] DEFAULT '{}',
    subtasks JSONB DEFAULT '[]',
    comments JSONB DEFAULT '[]',
    activity_log JSONB DEFAULT '[]',
    time_spent INTEGER DEFAULT 0,
    timer_started_at BIGINT
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

-- Insert initial data (optional - matching constants.ts)
-- Only admin user with zero XP and no achievements (like a new user)
INSERT INTO users (id, username, password, role, avatar, xp, achievements) VALUES
    ('u1', 'admin', 'password', 'ADMIN', 'https://api.dicebear.com/9.x/pixel-art/svg?seed=admin_core', 0, ARRAY[]::TEXT[])
ON CONFLICT (id) DO NOTHING;

-- Projects, tasks and snippets will be created by users via the application

