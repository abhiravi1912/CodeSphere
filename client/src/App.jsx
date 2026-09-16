import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';

// ─────────────────────────────────────────────
// Full-screen loading spinner shown during auth check
// ─────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0F19] space-y-4">
      <div className="w-9 h-9 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-slate-400 text-xs tracking-wider font-medium">Loading CodeSphere…</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Home Route: Landing Page if unauth, Dashboard if auth
// ─────────────────────────────────────────────
function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <DashboardPage />;
  return <LandingPage />;
}

// ─────────────────────────────────────────────
// Protected Route — redirects unauthenticated users to /login
// ─────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

// ─────────────────────────────────────────────
// Guest Route — redirects already-authenticated users to /dashboard
// ─────────────────────────────────────────────
function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;

  return children;
}

// ─────────────────────────────────────────────
// Route declarations
// ─────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Root route — Landing page for guests, Dashboard for users */}
      <Route path="/" element={<HomeRoute />} />

      {/* Guest-only routes */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

      {/* Explicit Protected Dashboard route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Project Workspace route */}
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <ProjectDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all → Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─────────────────────────────────────────────
// Root App — wraps everything with providers
// ─────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
