
import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Role } from './types';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then(module => ({ default: module.CalendarPage })));
const AdminPanel = lazy(() => import('./pages/AdminPanel').then(module => ({ default: module.AdminPanel })));
const TaskDetail = lazy(() => import('./pages/TaskDetail').then(module => ({ default: module.TaskDetail })));
const Snippets = lazy(() => import('./pages/Snippets').then(module => ({ default: module.Snippets })));
const Leaderboard = lazy(() => import('./pages/Leaderboard').then(module => ({ default: module.Leaderboard })));
const SystemLogs = lazy(() => import('./pages/SystemLogs').then(module => ({ default: module.SystemLogs })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-neon-main mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">LOADING...</p>
    </div>
  </div>
);

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
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={
          <Suspense fallback={<LoadingFallback />}>
            <LoginPage />
          </Suspense>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<LoadingFallback />}>
                <Dashboard />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/calendar" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<LoadingFallback />}>
                <CalendarPage />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/task/:id" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<LoadingFallback />}>
                <TaskDetail />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/create-task" element={
          <ProtectedRoute requiredRole={Role.DEVELOPER}>
            <Layout>
              <Suspense fallback={<LoadingFallback />}>
                <TaskDetail isNew />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/snippets" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<LoadingFallback />}>
                <Snippets />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/logs" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<LoadingFallback />}>
                <SystemLogs />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<LoadingFallback />}>
                <Leaderboard />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute requiredRole={Role.ADMIN}>
            <Layout>
              <Suspense fallback={<LoadingFallback />}>
                <AdminPanel />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
