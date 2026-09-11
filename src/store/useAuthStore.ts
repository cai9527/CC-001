import { create } from 'zustand';
import type { User, ModuleKey } from '@/types';
import { mockUsers } from '@/services/mock/data';
import { usePermissionStore } from '@/store/usePermissionStore';
import { getEffectivePermissions } from '@/config/permissions';

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  users: User[];
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  getUsers: () => Promise<User[]>;
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'lastLogin'>) => Promise<User>;
  updateUser: (id: string, data: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<boolean>;
  /** 是否拥有某项操作权限（格式 module:action，如 vehicles:edit） */
  hasPermission: (permission: string) => boolean;
  /** 是否可访问某个功能模块 */
  hasModuleAccess: (module: ModuleKey) => boolean;
  /** 当前用户的全部有效权限码 */
  getPermissions: () => string[];
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: true,
  currentUser: mockUsers[0],
  users: mockUsers,
  loading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const user = mockUsers.find((u) => u.username === username && u.status === 'active');
    if (user) {
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      set({ isAuthenticated: true, currentUser: updatedUser, loading: false });
      localStorage.setItem('auth_token', 'mock_token_' + Date.now());
      return true;
    }
    set({ loading: false, error: '用户名或密码错误' });
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false, currentUser: null });
    localStorage.removeItem('auth_token');
  },

  clearError: () => {
    set({ error: null });
  },

  getUsers: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockUsers;
  },

  addUser: async (userData) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newUser: User = {
      ...userData,
      id: 'u' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ users: [...state.users, newUser] }));
    return newUser;
  },

  updateUser: async (id, data) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
    }));
    const updated = get().users.find((u) => u.id === id)!;
    return updated;
  },

  deleteUser: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    }));
    return true;
  },

  hasPermission: (permission: string) => {
    return get().getPermissions().includes(permission);
  },

  hasModuleAccess: (module: ModuleKey) => {
    return get().getPermissions().some((code) => code.startsWith(`${module}:`));
  },

  getPermissions: () => {
    const { currentUser } = get();
    if (!currentUser) return [];
    const { permissionMap } = usePermissionStore.getState();
    // 账号类型决定模块范围与操作上限，个人账号再由角色权限细化
    return getEffectivePermissions(permissionMap, currentUser);
  },
}));
