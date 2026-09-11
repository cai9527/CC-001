import { useMemo, useState } from 'react';
import {
  Shield,
  ShieldCheck,
  User as UserIcon,
  RotateCcw,
  Check,
  Lock,
  KeyRound,
  Info,
} from 'lucide-react';
import { usePermissionStore } from '@/store/usePermissionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { MODULES, ROLE_PERMISSIONS } from '@/config/permissions';
import { ACCOUNT_TYPES, PERMISSION_ACTIONS, ROLES } from '@/types';
import type { AccountType, PermissionAction } from '@/types';
import { classNames } from '@/utils';
import Modal from '@/components/UI/Modal';

const ACCOUNT_TYPE_ORDER: AccountType[] = ['admin', 'personal'];

const ACCOUNT_TYPE_ICONS: Record<AccountType, React.ElementType> = {
  admin: ShieldCheck,
  personal: UserIcon,
};

export default function PermissionsPage() {
  const { permissionMap, toggleAction, resetToDefault } = usePermissionStore();
  const { currentUser } = useAuthStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 仅管理员账号可编辑映射关系，个人账号只读
  const canEdit = currentUser?.accountType === 'admin';

  const stats = useMemo(() => {
    return ACCOUNT_TYPE_ORDER.map((type) => {
      const modules = permissionMap[type] ?? [];
      return {
        type,
        moduleCount: modules.length,
        actionCount: modules.reduce((sum, m) => sum + m.actions.length, 0),
      };
    });
  }, [permissionMap]);

  const businessModules = MODULES.filter((m) => m.group === 'business');
  const systemModules = MODULES.filter((m) => m.group === 'system');

  const handleToggle = (accountType: AccountType, module: (typeof MODULES)[number], action: PermissionAction) => {
    if (!canEdit) return;
    // 管理员账号的权限配置模块不允许移除编辑权限，避免失去入口后无法恢复
    if (accountType === 'admin' && module.key === 'system-permissions' && action === 'edit') return;
    toggleAction(accountType, module.key, action);
  };

  const renderActionCell = (accountType: AccountType, module: (typeof MODULES)[number]) => {
    const granted = permissionMap[accountType]?.find((m) => m.module === module.key)?.actions ?? [];
    return (
      <div className="flex flex-wrap gap-1.5">
        {module.actions.map((action) => {
          const active = granted.includes(action);
          const locked =
            accountType === 'admin' && module.key === 'system-permissions' && action === 'edit';
          return (
            <button
              key={action}
              type="button"
              disabled={!canEdit || locked}
              onClick={() => handleToggle(accountType, module, action)}
              title={locked ? '为保证可恢复，该权限不可移除' : undefined}
              className={classNames(
                'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-all',
                active
                  ? 'bg-primary-50 text-primary-700 border-primary-200'
                  : 'bg-neutral-50 text-neutral-400 border-neutral-200',
                canEdit && !locked && 'hover:border-primary-400 hover:text-primary-600 cursor-pointer',
                (!canEdit || locked) && 'cursor-not-allowed opacity-80'
              )}
            >
              {active && <Check className="w-3 h-3" />}
              {PERMISSION_ACTIONS[action].label}
            </button>
          );
        })}
      </div>
    );
  };

  const renderModuleRows = (modules: typeof MODULES) =>
    modules.map((module) => (
      <tr key={module.key} className="border-t border-neutral-100 hover:bg-neutral-50/50">
        <td className="px-4 py-3">
          <div className="font-medium text-neutral-800">{module.label}</div>
          <div className="text-xs text-neutral-400 mt-0.5">{module.path}</div>
        </td>
        {ACCOUNT_TYPE_ORDER.map((type) => (
          <td key={type} className="px-4 py-3">
            {renderActionCell(type, module)}
          </td>
        ))}
      </tr>
    ));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">权限配置</h1>
          <p className="text-sm text-neutral-500 mt-1">
            维护账号类型与功能模块的权限映射关系，修改即时生效并自动保存
          </p>
        </div>
        <button
          onClick={() => canEdit && setShowResetConfirm(true)}
          disabled={!canEdit}
          className={classNames(
            'btn btn-default flex items-center gap-2',
            !canEdit && 'opacity-50 cursor-not-allowed'
          )}
        >
          <RotateCcw className="w-4 h-4" />
          恢复默认
        </button>
      </div>

      {!canEdit && (
        <div className="card p-3 bg-warning-50 border border-warning-200 flex items-center gap-2 text-sm text-warning-700">
          <Lock className="w-4 h-4 flex-shrink-0" />
          当前为个人账号，权限映射为只读模式，仅管理员账号可编辑
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map(({ type, moduleCount, actionCount }) => {
          const Icon = ACCOUNT_TYPE_ICONS[type];
          const config = ACCOUNT_TYPES[type];
          return (
            <div key={type} className="card p-5">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${config.color}1A` }}
                >
                  <Icon className="w-6 h-6" style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-neutral-800">{config.label}</h3>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: config.color }}
                    >
                      {type}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-1">{config.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-neutral-600">
                      已授权模块 <span className="font-semibold text-neutral-800">{moduleCount}</span> / {MODULES.length}
                    </span>
                    <span className="text-neutral-600">
                      操作权限 <span className="font-semibold text-neutral-800">{actionCount}</span> 项
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary-500" />
          <h2 className="font-semibold text-neutral-800">账号类型 × 模块权限矩阵</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50">
                <th className="px-4 py-3 text-left font-medium text-neutral-600 w-48">功能模块</th>
                {ACCOUNT_TYPE_ORDER.map((type) => (
                  <th key={type} className="px-4 py-3 text-left font-medium text-neutral-600">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4" style={{ color: ACCOUNT_TYPES[type].color }} />
                      {ACCOUNT_TYPES[type].label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className="px-4 py-2 bg-neutral-50/70 text-xs font-medium text-neutral-500">
                  业务模块
                </td>
              </tr>
              {renderModuleRows(businessModules)}
              <tr>
                <td colSpan={3} className="px-4 py-2 bg-neutral-50/70 text-xs font-medium text-neutral-500">
                  系统管理
                </td>
              </tr>
              {renderModuleRows(systemModules)}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary-500" />
          <h2 className="font-semibold text-neutral-800">个人账号角色权限细化</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-neutral-500 mb-4">
            个人账号的有效权限 = 上方账号类型模块权限 ∩ 角色操作权限。角色在账号类型授权范围内进一步收紧可操作的功能。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(Object.entries(ROLES) as [keyof typeof ROLES, (typeof ROLES)[keyof typeof ROLES]][]).map(
              ([role, config]) => (
                <div key={role} className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="font-medium text-neutral-800">{config.label}</span>
                    <span className="text-xs text-neutral-400">
                      {role === 'admin' ? '管理员账号' : '个人账号'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mb-3">{config.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(ROLE_PERMISSIONS[role] ?? []).map((code) => {
                      if (code === '*') {
                        return (
                          <span key={code} className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded">
                            全部权限
                          </span>
                        );
                      }
                      const [moduleKey, action] = code.split(':') as [string, PermissionAction];
                      const moduleLabel = MODULES.find((m) => m.key === moduleKey)?.label ?? moduleKey;
                      return (
                        <span key={code} className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded">
                          {moduleLabel}·{PERMISSION_ACTIONS[action]?.label ?? action}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <Modal
          open={showResetConfirm}
          onClose={() => setShowResetConfirm(false)}
          title="恢复默认权限"
          size="sm"
          footer={
            <>
              <button onClick={() => setShowResetConfirm(false)} className="btn btn-default">
                取消
              </button>
              <button
                onClick={() => {
                  resetToDefault();
                  setShowResetConfirm(false);
                }}
                className="btn btn-danger"
              >
                确认恢复
              </button>
            </>
          }
        >
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto bg-warning-100 rounded-full flex items-center justify-center mb-4">
              <RotateCcw className="w-8 h-8 text-warning-500" />
            </div>
            <p className="text-lg font-medium text-neutral-800">确定要恢复默认权限映射吗？</p>
            <p className="text-sm text-neutral-500 mt-2">
              所有账号类型的自定义权限配置将被重置为系统默认值
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
