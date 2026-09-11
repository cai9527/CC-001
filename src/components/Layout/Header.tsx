import { useState } from 'react';
import { Bell, Search, User, LogOut, Settings, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSafetyStore } from '@/store/useSafetyStore';
import { formatDateTime, classNames } from '@/utils';
import { ROLES } from '@/types';

export default function Header() {
  const { currentUser, logout } = useAuthStore();
  const { alerts } = useSafetyStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const pendingAlerts = alerts.filter((a) => a.status === 'pending');

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg">
          <Menu className="w-5 h-5 text-neutral-600" />
        </button>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索车牌号、任务编号、驾驶员..."
            className="w-80 pl-10 pr-4 py-2 bg-neutral-100 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-neutral-600" />
            {pendingAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce-light">
                {pendingAlerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden animate-slide-up">
              <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
                <h3 className="font-medium text-neutral-800">安全预警</h3>
                <span className="text-xs text-neutral-500">{pendingAlerts.length} 条待处理</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {pendingAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="px-4 py-3 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={classNames(
                          'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                          alert.level === 'critical' || alert.level === 'high'
                            ? 'bg-danger-500'
                            : 'bg-warning-500'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-800 truncate">{alert.description}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {formatDateTime(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingAlerts.length === 0 && (
                  <div className="px-4 py-8 text-center text-neutral-500 text-sm">
                    暂无待处理预警
                  </div>
                )}
              </div>
              <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200">
                <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium">
                  查看全部预警
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full bg-neutral-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-neutral-800">{currentUser?.name}</p>
              <p className="text-xs text-neutral-500">
                {currentUser?.role ? ROLES[currentUser.role].label : ''}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden animate-slide-up">
              <div className="px-4 py-3 border-b border-neutral-200">
                <p className="font-medium text-neutral-800">{currentUser?.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{currentUser?.username}</p>
              </div>
              <div className="py-1">
                <button className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3">
                  <Settings className="w-4 h-4" />
                  个人设置
                </button>
                <button
                  onClick={logout}
                  className="w-full px-4 py-2.5 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-3"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
