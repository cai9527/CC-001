import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  ClipboardList,
  Users,
  BarChart3,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { useState } from 'react';
import { classNames } from '@/utils';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/vehicles', label: '车辆管理', icon: Truck },
  {
    path: '/tasks',
    label: '任务调度',
    icon: ClipboardList,
    children: [
      { path: '/tasks', label: '任务列表', icon: ClipboardList },
      { path: '/tasks/tracking', label: '实时跟踪', icon: MapPin },
    ],
  },
  { path: '/drivers', label: '驾驶员管理', icon: Users },
  { path: '/statistics', label: '运输统计', icon: BarChart3 },
  { path: '/safety', label: '安全监控', icon: ShieldAlert },
  {
    path: '/system',
    label: '系统管理',
    icon: Settings,
    children: [
      { path: '/system/users', label: '用户管理', icon: Users },
      { path: '/system/permissions', label: '权限配置', icon: Settings },
      { path: '/system/backup', label: '数据备份', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['/tasks', '/system']);
  const location = useLocation();

  const toggleMenu = (path: string) => {
    setExpandedMenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isPathActive = (item: MenuItem): boolean => {
    if (item.children) {
      return item.children.some((child) => location.pathname === child.path);
    }
    return location.pathname === item.path;
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const Icon = item.icon;
    const isActive = isPathActive(item);
    const isExpanded = expandedMenus.includes(item.path);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.path}>
        {hasChildren ? (
          <button
            onClick={() => toggleMenu(item.path)}
            className={classNames(
              'sidebar-item w-full text-left',
              isActive ? 'sidebar-item-active' : 'sidebar-item-inactive',
              level > 0 && 'pl-11'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {isExpanded ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </>
            )}
          </button>
        ) : (
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              classNames(
                'sidebar-item',
                isActive ? 'sidebar-item-active' : 'sidebar-item-inactive',
                level > 0 && 'pl-11'
              )
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        )}
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={classNames(
        'fixed left-0 top-0 h-full bg-white border-r border-neutral-200 transition-all duration-300 z-40 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-neutral-800">运渣车管理</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center mx-auto">
            <Truck className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>

      <div className="p-2 border-t border-neutral-200">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-item w-full justify-center text-neutral-500 hover:text-primary-600"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>收起菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
