import { create } from 'zustand';
import type { AccountType, AccountTypePermissionMap, ModuleKey, PermissionAction } from '@/types';
import {
  MODULES,
  accountTypeHasModule,
  accountTypeModuleActions,
  cloneDefaultPermissions,
} from '@/config/permissions';

const STORAGE_KEY = 'account_type_permissions';

interface PermissionState {
  /** 账号类型 -> 模块权限 的映射关系（运行时可编辑） */
  permissionMap: AccountTypePermissionMap;
  /** 切换某账号类型在指定模块上的某项操作权限 */
  toggleAction: (accountType: AccountType, module: ModuleKey, action: PermissionAction) => void;
  /** 批量设置某账号类型在指定模块上的操作权限 */
  setModuleActions: (accountType: AccountType, module: ModuleKey, actions: PermissionAction[]) => void;
  /** 恢复默认映射 */
  resetToDefault: () => void;
  /** 查询账号类型是否可访问某模块 */
  hasModuleAccess: (accountType: AccountType, module: ModuleKey) => boolean;
  /** 查询账号类型在某模块上的操作权限 */
  getModuleActions: (accountType: AccountType, module: ModuleKey) => PermissionAction[];
}

function loadFromStorage(): AccountTypePermissionMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AccountTypePermissionMap;
      // 校验结构合法性，损坏数据回退默认映射
      if (parsed && Array.isArray(parsed.admin) && Array.isArray(parsed.personal)) {
        return parsed;
      }
    }
  } catch {
    // ignore corrupted cache
  }
  return cloneDefaultPermissions();
}

function persist(map: AccountTypePermissionMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // storage full or unavailable — keep runtime state only
  }
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissionMap: loadFromStorage(),

  toggleAction: (accountType, module, action) => {
    const { permissionMap } = get();
    const moduleDef = MODULES.find((m) => m.key === module);
    if (!moduleDef || !moduleDef.actions.includes(action)) return;

    const current = permissionMap[accountType] ?? [];
    const existing = current.find((m) => m.module === module);
    let next: AccountTypePermissionMap[AccountType];

    if (existing) {
      const hasAction = existing.actions.includes(action);
      const actions = hasAction
        ? existing.actions.filter((a) => a !== action)
        : [...existing.actions, action];
      next = current
        .map((m) => (m.module === module ? { ...m, actions } : m))
        .filter((m) => m.actions.length > 0);
    } else {
      next = [...current, { module, actions: [action] }];
    }

    const permissionMapNext = { ...permissionMap, [accountType]: next };
    persist(permissionMapNext);
    set({ permissionMap: permissionMapNext });
  },

  setModuleActions: (accountType, module, actions) => {
    const { permissionMap } = get();
    const moduleDef = MODULES.find((m) => m.key === module);
    if (!moduleDef) return;

    const validActions = actions.filter((a) => moduleDef.actions.includes(a));
    const current = permissionMap[accountType] ?? [];
    const exists = current.some((m) => m.module === module);

    let next: AccountTypePermissionMap[AccountType];
    if (validActions.length === 0) {
      next = current.filter((m) => m.module !== module);
    } else if (exists) {
      next = current.map((m) => (m.module === module ? { ...m, actions: validActions } : m));
    } else {
      next = [...current, { module, actions: validActions }];
    }

    const permissionMapNext = { ...permissionMap, [accountType]: next };
    persist(permissionMapNext);
    set({ permissionMap: permissionMapNext });
  },

  resetToDefault: () => {
    const permissionMap = cloneDefaultPermissions();
    persist(permissionMap);
    set({ permissionMap });
  },

  hasModuleAccess: (accountType, module) => {
    return accountTypeHasModule(get().permissionMap, accountType, module);
  },

  getModuleActions: (accountType, module) => {
    return accountTypeModuleActions(get().permissionMap, accountType, module);
  },
}));
