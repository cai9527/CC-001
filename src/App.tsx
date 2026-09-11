import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermissionStore } from '@/store/usePermissionStore';
import type { ModuleKey } from '@/types';
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
import PermissionsPage from '@/pages/System/permissions';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

/** 无模块访问权限时的提示页 */
function Forbidden() {
  return (
    <div className="card p-12 text-center">
      <div className="w-16 h-16 mx-auto bg-danger-100 rounded-full flex items-center justify-center mb-4">
        <ShieldX className="w-8 h-8 text-danger-500" />
      </div>
      <h2 className="text-xl font-semibold text-neutral-800 mb-2">暂无访问权限</h2>
      <p className="text-neutral-500">当前账号类型未被授予该模块的访问权限，请联系系统管理员</p>
    </div>
  );
}

/** 基于账号类型模块权限映射的路由守卫 */
function PermissionRoute({ module, children }: { module: ModuleKey; children: React.ReactNode }) {
  const { hasModuleAccess } = useAuthStore();
  // 订阅权限映射，权限配置修改后路由守卫实时生效
  usePermissionStore((state) => state.permissionMap);
  return hasModuleAccess(module) ? <>{children}</> : <Forbidden />;
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
          <Route
            index
            element={
              <PermissionRoute module="dashboard">
                <DashboardPage />
              </PermissionRoute>
            }
          />
          <Route
            path="vehicles"
            element={
              <PermissionRoute module="vehicles">
                <VehiclesPage />
              </PermissionRoute>
            }
          />
          <Route
            path="tasks"
            element={
              <PermissionRoute module="tasks">
                <TasksPage />
              </PermissionRoute>
            }
          />
          <Route
            path="drivers"
            element={
              <PermissionRoute module="drivers">
                <DriversPage />
              </PermissionRoute>
            }
          />
          <Route
            path="statistics"
            element={
              <PermissionRoute module="statistics">
                <StatisticsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="safety"
            element={
              <PermissionRoute module="safety">
                <SafetyPage />
              </PermissionRoute>
            }
          />
          <Route
            path="system/users"
            element={
              <PermissionRoute module="system-users">
                <UsersPage />
              </PermissionRoute>
            }
          />
          <Route
            path="system/backup"
            element={
              <PermissionRoute module="system-backup">
                <BackupPage />
              </PermissionRoute>
            }
          />
          <Route
            path="system/permissions"
            element={
              <PermissionRoute module="system-permissions">
                <PermissionsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="tasks/tracking"
            element={
              <PermissionRoute module="tasks">
                <div className="card p-8 text-center">
                  <h2 className="text-xl font-semibold text-neutral-800 mb-2">实时跟踪</h2>
                  <p className="text-neutral-500">功能开发中...</p>
                </div>
              </PermissionRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
