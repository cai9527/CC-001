import { useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Eye, Phone, FileText } from 'lucide-react';
import { useDriverStore } from '@/store/useDriverStore';
import DataTable from '@/components/UI/DataTable';
import StatusBadge from '@/components/UI/StatusBadge';
import Modal from '@/components/UI/Modal';
import { DRIVER_STATUS } from '@/types';
import { formatDate, classNames } from '@/utils';
import type { Driver } from '@/types';

export default function DriversPage() {
  const { drivers, loading, deleteDriver } = useDriverStore();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const pageSize = 10;

  const filteredDrivers = drivers.filter((d) => {
    const matchSearch =
      d.name.includes(searchText) ||
      d.phone.includes(searchText) ||
      d.licenseNumber.includes(searchText);
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pagedDrivers = filteredDrivers.slice((page - 1) * pageSize, page * pageSize);

  const handleViewDetail = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDetailModal(true);
  };

  const handleDelete = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedDriver) {
      deleteDriver(selectedDriver.id);
      setShowDeleteConfirm(false);
      setSelectedDriver(null);
    }
  };

  const getStatusBadge = (status: Driver['status']) => {
    const config = DRIVER_STATUS[status];
    return <StatusBadge variant={config.color as any}>{config.label}</StatusBadge>;
  };

  const getLicenseExpiryStatus = (date: string) => {
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { variant: 'danger' as const, text: '已过期' };
    if (days < 90) return { variant: 'warning' as const, text: `${days}天后到期` };
    return { variant: 'success' as const, text: '正常' };
  };

  const columns = [
    {
      key: 'avatar',
      title: '照片',
      width: '60px',
      render: (row: Driver) => (
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
          {row.avatar ? (
            <img src={row.avatar} alt={row.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary-600 font-medium">{row.name.charAt(0)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      title: '姓名',
      width: '100px',
      render: (row: Driver) => (
        <span className="font-medium text-neutral-800">{row.name}</span>
      ),
    },
    {
      key: 'phone',
      title: '联系电话',
      width: '130px',
      render: (row: Driver) => (
        <div className="flex items-center gap-1 text-neutral-700">
          <Phone className="w-3.5 h-3.5 text-neutral-400" />
          {row.phone}
        </div>
      ),
    },
    {
      key: 'licenseType',
      title: '驾照类型',
      width: '90px',
      render: (row: Driver) => row.licenseType,
    },
    {
      key: 'licenseNumber',
      title: '驾照编号',
      render: (row: Driver) => row.licenseNumber,
    },
    {
      key: 'experience',
      title: '驾龄',
      width: '70px',
      render: (row: Driver) => `${row.drivingYears}年`,
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (row: Driver) => getStatusBadge(row.status),
    },
    {
      key: 'licenseExpiry',
      title: '驾照到期',
      width: '130px',
      render: (row: Driver) => {
        const status = getLicenseExpiryStatus(row.licenseExpiry);
        return (
          <div>
            <div className="text-sm text-neutral-700">{formatDate(row.licenseExpiry)}</div>
            <StatusBadge variant={status.variant} className="mt-1">
              {status.text}
            </StatusBadge>
          </div>
        );
      },
    },
    {
      key: 'operation',
      title: '操作',
      width: '120px',
      render: (row: Driver) => (
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
            title="证件管理"
          >
            <FileText className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold text-neutral-800">驾驶员管理</h1>
          <p className="text-sm text-neutral-500 mt-1">管理所有驾驶员的基本信息、资质证书和工作状态</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增驾驶员
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索姓名、电话、驾照编号..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              <option value="all">全部状态</option>
              {Object.entries(DRIVER_STATUS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            {Object.entries(DRIVER_STATUS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1 text-sm">
                <span
                  className={classNames(
                    'w-2.5 h-2.5 rounded-full',
                    val.color === 'success' && 'bg-success-500',
                    val.color === 'warning' && 'bg-warning-500',
                    val.color === 'danger' && 'bg-danger-500',
                    val.color === 'neutral' && 'bg-neutral-500',
                    val.color === 'primary' && 'bg-primary-500'
                  )}
                />
                <span className="text-neutral-600">{val.label}</span>
                <span className="text-neutral-500 font-medium">
                  ({drivers.filter((d) => d.status === key).length})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pagedDrivers}
        loading={loading}
        pagination={{
          page,
          pageSize,
          total: filteredDrivers.length,
          onPageChange: setPage,
        }}
      />

      {showDetailModal && selectedDriver && (
        <Modal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="驾驶员详情"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {selectedDriver.avatar ? (
                  <img
                    src={selectedDriver.avatar}
                    alt={selectedDriver.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-primary-600 font-bold">
                    {selectedDriver.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-neutral-800">{selectedDriver.name}</h3>
                  {getStatusBadge(selectedDriver.status)}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-500">联系电话：</span>
                    <span className="font-medium text-neutral-800">{selectedDriver.phone}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">身份证号：</span>
                    <span className="font-medium text-neutral-800">{selectedDriver.idCard}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">入职日期：</span>
                    <span className="font-medium text-neutral-800">
                      {formatDate(selectedDriver.hireDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">驾龄：</span>
                    <span className="font-medium text-neutral-800">{selectedDriver.drivingYears}年</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary-500 rounded-full" />
                  驾驶资质
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-500">驾照类型：</span>
                    <span className="font-medium text-neutral-800">{selectedDriver.licenseType}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">驾照编号：</span>
                    <span className="font-medium text-neutral-800">{selectedDriver.licenseNumber}</span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">驾照有效期</span>
                      <div className="text-right">
                        <span className="font-medium text-neutral-800">
                          {formatDate(selectedDriver.licenseExpiry)}
                        </span>
                        <div className="mt-1">
                          {(() => {
                            const status = getLicenseExpiryStatus(selectedDriver.licenseExpiry);
                            return <StatusBadge variant={status.variant}>{status.text}</StatusBadge>;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500">从业资格证：</span>
                    <span className="font-medium text-neutral-800">{selectedDriver.qualificationCert}</span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">从业资格证有效期</span>
                      <div className="text-right">
                        <span className="font-medium text-neutral-800">
                          {formatDate(selectedDriver.qualificationExpiry)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1 h-5 bg-warning-500 rounded-full" />
                  安全记录
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-500">累计安全行驶：</span>
                    <span className="font-medium text-neutral-800">{selectedDriver.accidentCount === 0 ? '无事故' : `${selectedDriver.accidentCount}次事故`}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">累计违章次数：</span>
                    <span className="font-medium text-neutral-800">{selectedDriver.violationCount}次</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">安全培训记录：</span>
                    <span className="font-medium text-neutral-800">{selectedDriver.trainingRecords.length}次</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">体检有效期至：</span>
                    <span className="font-medium text-neutral-800">
                      {formatDate(selectedDriver.physicalExpiry)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <div className="w-1 h-5 bg-success-500 rounded-full" />
                紧急联系人
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">紧急联系人：</span>
                  <span className="font-medium text-neutral-800">{selectedDriver.emergencyContact.name}</span>
                </div>
                <div>
                  <span className="text-neutral-500">联系电话：</span>
                  <span className="font-medium text-neutral-800">{selectedDriver.emergencyContact.phone}</span>
                </div>
                <div>
                  <span className="text-neutral-500">与本人关系：</span>
                  <span className="font-medium text-neutral-800">{selectedDriver.emergencyContact.relationship}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteConfirm && selectedDriver && (
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
              确定要删除驾驶员 {selectedDriver.name} 吗？
            </p>
            <p className="text-sm text-neutral-500 mt-2">此操作不可撤销，相关数据将被永久删除</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
