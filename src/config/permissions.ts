import type {
  AccountType,
  AccountTypePermissionMap,
  ModuleKey,
  PermissionAction,
  Role,
  User,
} from '@/types';

/**
 * 系统功能模块注册表。
 * path 用于路由守卫与菜单过滤，actions 为该模块支持的操作权限集合。
 */
export const MODULES: {
  key: ModuleKey;
  label: string;
  path: string;
  group: 'business' | 'system';
  actions: PermissionAction[];
}[] = [
  { key: 'dashboard', label: '仪表盘', path: '/', group: 'business', actions: ['view'] },
  { key: 'vehicles', label: '车辆管理', path: '/vehicles', group: 'business', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'tasks', label: '任务调度', path: '/tasks', group: 'business', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'drivers', label: '驾驶员管理', path: '/drivers', group: 'business', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'statistics', label: '运输统计', path: '/statistics', group: 'business', actions: ['view', 'export'] },
  { key: 'safety', label: '安全监控', path: '/safety', group: 'business', actions: ['view', 'process'] },
  { key: 'system-users', label: '用户管理', path: '/system/users', group: 'system', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'system-permissions', label: '权限配置', path: '/system/permissions', group: 'system', actions: ['view', 'edit'] },
  { key: 'system-backup', label: '数据备份', path: '/system/backup', group: 'system', actions: ['view', 'create', 'delete'] },
];

const ALL_MODULES_FULL_ACCESS: AccountTypePermissionMap['admin'] = MODULES.map((m) => ({
  module: m.key,
  actions: [...m.actions],
}));

/**
 * 账号类型 -> 模块权限 的默认映射关系。
 * - 管理员账号：全部模块的全部操作权限
 * - 个人账号：仅业务模块，且不含删除等高危操作；系统管理模块一律不开放
 */
export const DEFAULT_ACCOUNT_TYPE_PERMISSIONS: AccountTypePermissionMap = {
  admin: ALL_MODULES_FULL_ACCESS,
  personal: [
    { module: 'dashboard', actions: ['view'] },
    { module: 'vehicles', actions: ['view', 'create', 'edit'] },
    { module: 'tasks', actions: ['view', 'create', 'edit'] },
    { module: 'drivers', actions: ['view', 'create', 'edit'] },
    { module: 'statistics', actions: ['view', 'export'] },
    { module: 'safety', actions: ['view', 'process'] },
  ],
};

/** 角色 -> 账号类型 的归属映射：admin 角色为管理员账号，其余业务角色均为个人账号 */
export const ROLE_ACCOUNT_TYPE: Record<Role, AccountType> = {
  admin: 'admin',
  manager: 'personal',
  dispatcher: 'personal',
  safety_officer: 'personal',
  fleet_captain: 'personal',
};

/**
 * 角色 -> 操作权限码（module:action）映射。
 * 个人账号的有效权限 = 账号类型模块权限 ∩ 角色操作权限。
 */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ['*'],
  manager: [
    'dashboard:view',
    'statistics:view',
    'statistics:export',
    'vehicles:view',
    'drivers:view',
    'tasks:view',
    'safety:view',
  ],
  dispatcher: [
    'dashboard:view',
    'tasks:view',
    'tasks:create',
    'tasks:edit',
    'vehicles:view',
    'drivers:view',
  ],
  safety_officer: [
    'dashboard:view',
    'safety:view',
    'safety:process',
    'vehicles:view',
    'drivers:view',
  ],
  fleet_captain: [
    'dashboard:view',
    'vehicles:view',
    'vehicles:edit',
    'drivers:view',
    'drivers:edit',
    'tasks:view',
  ],
};

/** 获取用户的账号类型（兼容历史数据：无 accountType 字段时按角色推导） */
export function getUserAccountType(user: Pick<User, 'role'> & { accountType?: AccountType }): AccountType {
  return user.accountType ?? ROLE_ACCOUNT_TYPE[user.role] ?? 'personal';
}

/** 深拷贝默认映射，避免运行时编辑污染常量 */
export function cloneDefaultPermissions(): AccountTypePermissionMap {
  return {
    admin: DEFAULT_ACCOUNT_TYPE_PERMISSIONS.admin.map((m) => ({ module: m.module, actions: [...m.actions] })),
    personal: DEFAULT_ACCOUNT_TYPE_PERMISSIONS.personal.map((m) => ({ module: m.module, actions: [...m.actions] })),
  };
}

/** 判断指定账号类型是否可访问某模块 */
export function accountTypeHasModule(
  map: AccountTypePermissionMap,
  accountType: AccountType,
  module: ModuleKey
): boolean {
  return (map[accountType] ?? []).some((m) => m.module === module && m.actions.length > 0);
}

/** 获取指定账号类型在某模块上被授予的操作权限 */
export function accountTypeModuleActions(
  map: AccountTypePermissionMap,
  accountType: AccountType,
  module: ModuleKey
): PermissionAction[] {
  return map[accountType]?.find((m) => m.module === module)?.actions ?? [];
}

/**
 * 计算用户的有效权限码集合（账号类型模块权限 ∩ 角色操作权限）。
 * 管理员账号直接拥有映射表中的全部权限。
 */
export function getEffectivePermissions(
  map: AccountTypePermissionMap,
  user: Pick<User, 'role'> & { accountType?: AccountType }
): string[] {
  const accountType = getUserAccountType(user);
  const modulePerms = map[accountType] ?? [];
  const rolePerms = ROLE_PERMISSIONS[user.role] ?? [];

  const result: string[] = [];
  for (const { module, actions } of modulePerms) {
    for (const action of actions) {
      const code = `${module}:${action}`;
      if (accountType === 'admin' || rolePerms.includes('*') || rolePerms.includes(code)) {
        result.push(code);
      }
    }
  }
  return result;
}
