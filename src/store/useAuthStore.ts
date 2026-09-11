import { create } from 'zustand';
import type { User, Role } from '@/types';
import { mockUsers } from '@/services/mock/data';

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
  hasPermission: (permission: string) => boolean;
}

const rolePermissions: Record<Role, string[]> = {
  admin: ['*'],
  manager: ['dashboard:view', 'statistics:view', 'vehicles:view', 'drivers:view', 'tasks:view', 'safety:view'],
  dispatcher: ['dashboard:view', 'tasks:view', 'tasks:create', 'tasks:edit', 'vehicles:view', 'drivers:view'],
  safety_officer: ['dashboard:view', 'safety:view', 'safety:process', 'vehicles:view', 'drivers:view'],
  fleet_captain: ['dashboard:view', 'vehicles:view', 'vehicles:edit', 'drivers:view', 'drivers:edit', 'maintenance:edit'],
};

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
    const { currentUser } = get();
    if (!currentUser) return false;
    const permissions = rolePermissions[currentUser.role];
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  },
}));
