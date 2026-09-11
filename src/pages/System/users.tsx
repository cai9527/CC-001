import { useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Eye, User as UserIcon, Shield, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import DataTable from '@/components/UI/DataTable';
import StatusBadge from '@/components/UI/StatusBadge';
import Modal from '@/components/UI/Modal';
import { ROLES } from '@/types';
import { formatDate, classNames } from '@/utils';
import type { User } from '@/types';

export default function UsersPage() {
  const { users, loading, deleteUser } = useAuthStore();
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const pageSize = 10;

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.includes(searchText) ||
      u.username.includes(searchText) ||
      u.phone.includes(searchText);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteUser(selectedUser.id);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
    }
  };

  const getStatusBadge = (status: User['status']) => {
    if (status === 'active') {
      return <StatusBadge variant="success">正常</StatusBadge>;
    }
    return <StatusBadge variant="danger">禁用</StatusBadge>;
  };

  const getRoleBadge = (role: User['role']) => {
    const config = ROLES[role];
    return (
      <div className="flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-primary-500" />
        <span className="text-neutral-700">{config.label}</span>
      </div>
    );
  };

  const columns = [
    {
      key: 'avatar',
      title: '头像',
      width: '60px',
      render: (row: User) => (
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
          {row.avatar ? (
            <img src={row.avatar} alt={row.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-5 h-5 text-primary-600" />
          )}
        </div>
      ),
    },
    {
      key: 'name',
      title: '姓名',
      width: '100px',
      render: (row: User) => (
        <span className="font-medium text-neutral-800">{row.name}</span>
      ),
    },
    {
      key: 'username',
      title: '用户名',
      width: '120px',
      render: (row: User) => <span className="text-neutral-600">{row.username}</span>,
    },
    {
      key: 'role',
      title: '角色',
      width: '120px',
      render: (row: User) => getRoleBadge(row.role),
    },
    {
      key: 'phone',
      title: '联系电话',
      width: '130px',
      render: (row: User) => row.phone,
    },
    {
      key: 'email',
      title: '邮箱',
      render: (row: User) => row.email,
    },
    {
      key: 'department',
      title: '部门',
      width: '120px',
      render: (row: User) => row.department || '-',
    },
    {
      key: 'status',
      title: '状态',
      width: '80px',
      render: (row: User) => getStatusBadge(row.status),
    },
    {
      key: 'createdAt',
      title: '创建时间',
      width: '150px',
      render: (row: User) => formatDate(row.createdAt),
    },
    {
      key: 'operation',
      title: '操作',
      width: '120px',
      render: (row: User) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewDetail(row)}
            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="权限配置"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 text-danger-600 hover:bg-danger-50 rounded transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">用户管理</h1>
          <p className="text-sm text-neutral-500 mt-1">管理系统用户账户、角色权限和个人信息</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增用户
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(ROLES).map(([key, val]) => {
          const count = users.filter((u) => u.role === key).length;
          return (
            <div key={key} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-neutral-800">{count}</div>
                <div className="text-sm text-neutral-500">{val.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索姓名、用户名、电话..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              <option value="all">全部角色</option>
              {Object.entries(ROLES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pagedUsers}
        loading={loading}
        pagination={{
          page,
          pageSize,
          total: filteredUsers.length,
          onPageChange: setPage,
        }}
      />

      {showDetailModal && selectedUser && (
        <Modal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="用户详情"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-12 h-12 text-primary-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-neutral-800">{selectedUser.name}</h3>
                  {getStatusBadge(selectedUser.status)}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {getRoleBadge(selectedUser.role)}
                </div>
                <p className="text-sm text-neutral-500">
                  {selectedUser.department && `${selectedUser.department} · `}
                  {selectedUser.phone}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary-500 rounded-full" />
                  基本信息
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">用户名</span>
                    <span className="font-medium text-neutral-800">{selectedUser.username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">联系电话</span>
                    <span className="font-medium text-neutral-800">{selectedUser.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">邮箱</span>
                    <span className="font-medium text-neutral-800">{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">部门</span>
                    <span className="font-medium text-neutral-800">{selectedUser.department || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">创建时间</span>
                    <span className="font-medium text-neutral-800">
                      {formatDate(selectedUser.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1 h-5 bg-warning-500 rounded-full" />
                  角色权限
                </h3>
                <div className="card p-4 bg-neutral-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-primary-500" />
                    <span className="font-medium text-neutral-800">
                      {ROLES[selectedUser.role].label}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mb-3">
                    {ROLES[selectedUser.role].description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLES[selectedUser.role].permissions.slice(0, 8).map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded"
                      >
                        {perm}
                      </span>
                    ))}
                    {ROLES[selectedUser.role].permissions.length > 8 && (
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded">
                        +{ROLES[selectedUser.role].permissions.length - 8}项
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteConfirm && selectedUser && (
        <Modal
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="确认删除"
          size="sm"
          footer={
            <>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-default"
              >
                取消
              </button>
              <button onClick={confirmDelete} className="btn btn-danger">
                确认删除
              </button>
            </>
          }
        >
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto bg-danger-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-danger-500" />
            </div>
            <p className="text-lg font-medium text-neutral-800">
              确定要删除用户 {selectedUser.name} 吗？
            </p>
            <p className="text-sm text-neutral-500 mt-2">此操作不可撤销，相关数据将被永久删除</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
