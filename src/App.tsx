import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import MainLayout from '@/components/Layout/MainLayout';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import VehiclesPage from '@/pages/Vehicles';
import TasksPage from '@/pages/Tasks';
import DriversPage from '@/pages/Drivers';
import StatisticsPage from '@/pages/Statistics';
import SafetyPage from '@/pages/Safety';
import UsersPage from '@/pages/System/users';
import BackupPage from '@/pages/System/backup';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="safety" element={<SafetyPage />} />
          <Route path="system/users" element={<UsersPage />} />
          <Route path="system/backup" element={<BackupPage />} />
          <Route
            path="system/permissions"
            element={
              <div className="card p-8 text-center">
                <h2 className="text-xl font-semibold text-neutral-800 mb-2">权限配置</h2>
                <p className="text-neutral-500">功能开发中...</p>
              </div>
            }
          />
          <Route
            path="tasks/tracking"
            element={
              <div className="card p-8 text-center">
                <h2 className="text-xl font-semibold text-neutral-800 mb-2">实时跟踪</h2>
                <p className="text-neutral-500">功能开发中...</p>
              </div>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
