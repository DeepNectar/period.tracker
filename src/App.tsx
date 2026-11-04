import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import Layout from './components/Layout';
import Toast from './components/Toast';
import AppLock from './components/AppLock';
import QuickAddFAB from './components/QuickAddFAB';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const isLoading = useAppStore(s => s.isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-950 via-pink-900 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">🌸</span>
          </div>
          <p className="text-rose-200 text-sm">Loading Bloom...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}

function AppLockGate({ children }: { children: React.ReactNode }) {
  const isAppLocked = useAppStore(s => s.isAppLocked);
  const pinHash = useAppStore(s => s.pinHash);

  if (pinHash && isAppLocked) {
    return <AppLock />;
  }

  return <>{children}</>;
}

function AuthRedirect() {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const isLoading = useAppStore(s => s.isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-950 via-pink-900 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">🌸</span>
          </div>
          <p className="text-rose-200 text-sm">Loading Bloom...</p>
        </div>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/signin'} replace />;
}

export default function App() {
  const init = useAppStore(s => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthRedirect />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLockGate>
                <Layout>
                  <Dashboard />
                  <QuickAddFAB />
                </Layout>
              </AppLockGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <AppLockGate>
                <Layout>
                  <Calendar />
                  <QuickAddFAB />
                </Layout>
              </AppLockGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <AppLockGate>
                <Layout>
                  <Insights />
                </Layout>
              </AppLockGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <AppLockGate>
                <Layout>
                  <Notifications />
                </Layout>
              </AppLockGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLockGate>
                <Layout>
                  <Settings />
                </Layout>
              </AppLockGate>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </BrowserRouter>
  );
}
