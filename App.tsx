
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';
import { TaskDetail } from './pages/TaskDetail';
import { Snippets } from './pages/Snippets';
import { Leaderboard } from './pages/Leaderboard';
import { TerminalPage } from './pages/TerminalPage';
import { SystemLogs } from './pages/SystemLogs';
import { Layout } from './components/Layout';
import { Role } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: Role }> = ({ children, requiredRole }) => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentUser.role !== requiredRole && currentUser.role !== Role.ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/task/:id" element={
        <ProtectedRoute>
          <Layout>
            <TaskDetail />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/create-task" element={
        <ProtectedRoute requiredRole={Role.DEVELOPER}>
          <Layout>
            <TaskDetail isNew />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/terminal" element={
        <ProtectedRoute>
          <Layout>
            <TerminalPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/snippets" element={
        <ProtectedRoute>
          <Layout>
            <Snippets />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/logs" element={
        <ProtectedRoute>
          <Layout>
            <SystemLogs />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <Layout>
            <Leaderboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute requiredRole={Role.ADMIN}>
          <Layout>
            <AdminPanel />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
};

export default App;
