import { useState } from 'react';
import { Truck, Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { classNames } from '@/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await login(username, password);
    if (success) {
      navigate('/');
    }
  };

  const quickLogin = async (role: string) => {
    const accounts: Record<string, { username: string; password: string }> = {
      admin: { username: 'admin', password: '123456' },
      manager: { username: 'manager', password: '123456' },
      dispatcher: { username: 'dispatcher', password: '123456' },
      safety: { username: 'safety_officer', password: '123456' },
      captain: { username: 'fleet_captain', password: '123456' },
    };
    const account = accounts[role];
    if (account) {
      setUsername(account.username);
      setPassword(account.password);
      const success = await login(account.username, account.password);
      if (success) {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/30">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">工地运渣车管理系统</h1>
          <p className="text-neutral-500">实现运渣车辆全生命周期数字化管理</p>
        </div>

        <div className="card p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-neutral-800 mb-6 text-center">欢迎登录</h2>

          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0" />
              <span className="text-sm text-danger-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearError();
                  }}
                  placeholder="请输入用户名"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  placeholder="请输入密码"
                  className="input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-600">记住我</span>
              </label>
              <button type="button" className="text-sm text-primary-600 hover:text-primary-700">
                忘记密码？
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={classNames(
                'w-full btn btn-primary py-3 text-base',
                loading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500">快速登录</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                onClick={() => quickLogin('admin')}
                className="px-3 py-2 text-xs bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors font-medium"
              >
                管理员
              </button>
              <button
                onClick={() => quickLogin('manager')}
                className="px-3 py-2 text-xs bg-success-50 text-success-700 rounded-lg hover:bg-success-100 transition-colors font-medium"
              >
                企业管理
              </button>
              <button
                onClick={() => quickLogin('dispatcher')}
                className="px-3 py-2 text-xs bg-warning-50 text-warning-700 rounded-lg hover:bg-warning-100 transition-colors font-medium"
              >
                调度员
              </button>
              <button
                onClick={() => quickLogin('safety')}
                className="px-3 py-2 text-xs bg-danger-50 text-danger-700 rounded-lg hover:bg-danger-100 transition-colors font-medium"
              >
                安全员
              </button>
              <button
                onClick={() => quickLogin('captain')}
                className="px-3 py-2 text-xs bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
              >
                车队队长
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-neutral-500">
          <p>© 2025 工地运渣车管理系统 v1.0.0</p>
          <p className="mt-1">技术支持：智慧工地解决方案</p>
        </div>
      </div>
    </div>
  );
}
