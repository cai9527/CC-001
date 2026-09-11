import { useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Eye, FileText, Wrench } from 'lucide-react';
import { useVehicleStore } from '@/store/useVehicleStore';
import DataTable from '@/components/UI/DataTable';
import StatusBadge from '@/components/UI/StatusBadge';
import Modal from '@/components/UI/Modal';
import { VEHICLE_STATUS, VEHICLE_TYPES } from '@/types';
import { formatDate, classNames } from '@/utils';
import type { Vehicle } from '@/types';

export default function VehiclesPage() {
  const { vehicles, loading, deleteVehicle } = useVehicleStore();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const pageSize = 10;

  const filteredVehicles = vehicles.filter((v) => {
    const matchSearch =
      v.plateNumber.includes(searchText) ||
      v.model.includes(searchText) ||
      v.driverName?.includes(searchText) ||
      false;
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pagedVehicles = filteredVehicles.slice((page - 1) * pageSize, page * pageSize);

  const handleViewDetail = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailModal(true);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedVehicle) {
      deleteVehicle(selectedVehicle.id);
      setShowDeleteConfirm(false);
      setSelectedVehicle(null);
    }
  };

  const getStatusBadge = (status: Vehicle['status']) => {
    const config = VEHICLE_STATUS[status];
    return <StatusBadge variant={config.color as any}>{config.label}</StatusBadge>;
  };

  const getExpiryStatus = (date: string) => {
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { variant: 'danger' as const, text: '已过期' };
    if (days < 30) return { variant: 'warning' as const, text: `${days}天后到期` };
    return { variant: 'success' as const, text: '正常' };
  };

  const columns = [
    {
      key: 'plateNumber',
      title: '车牌号',
      width: '120px',
      render: (row: Vehicle) => (
        <span className="font-medium text-neutral-800">{row.plateNumber}</span>
      ),
    },
    {
      key: 'vehicleType',
      title: '车辆类型',
      width: '100px',
      render: (row: Vehicle) => VEHICLE_TYPES[row.vehicleType]?.label || row.vehicleType,
    },
    {
      key: 'model',
      title: '车型',
      render: (row: Vehicle) => row.model,
    },
    {
      key: 'loadCapacity',
      title: '载重',
      width: '80px',
      render: (row: Vehicle) => `${row.loadCapacity}吨`,
    },
    {
      key: 'driverName',
      title: '驾驶员',
      width: '100px',
      render: (row: Vehicle) => row.driverName || '-',
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (row: Vehicle) => getStatusBadge(row.status),
    },
    {
      key: 'insuranceExpiry',
      title: '保险到期',
      width: '120px',
      render: (row: Vehicle) => {
        const status = getExpiryStatus(row.insuranceExpiry);
        return (
          <div>
            <div className="text-sm text-neutral-700">{formatDate(row.insuranceExpiry)}</div>
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
      width: '160px',
      render: (row: Vehicle) => (
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
            className="p-1.5 text-warning-600 hover:bg-warning-50 rounded transition-colors"
            title="维护记录"
          >
            <Wrench className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold text-neutral-800">车辆管理</h1>
          <p className="text-sm text-neutral-500 mt-1">管理所有运渣车辆的基本信息、证件和维护记录</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增车辆
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索车牌号、车型、驾驶员..."
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
              {Object.entries(VEHICLE_STATUS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {Object.entries(VEHICLE_STATUS).map(([key, val]) => (
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
                  ({vehicles.filter((v) => v.status === key).length})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pagedVehicles}
        loading={loading}
        pagination={{
          page,
          pageSize,
          total: filteredVehicles.length,
          onPageChange: setPage,
        }}
      />

      {showDetailModal && selectedVehicle && (
        <Modal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="车辆详情"
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary-500 rounded-full" />
                  基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-500">车牌号：</span>
                    <span className="font-medium text-neutral-800">{selectedVehicle.plateNumber}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">车辆类型：</span>
                    <span className="font-medium text-neutral-800">
                      {VEHICLE_TYPES[selectedVehicle.vehicleType]?.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">车型：</span>
                    <span className="font-medium text-neutral-800">{selectedVehicle.model}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">载重：</span>
                    <span className="font-medium text-neutral-800">{selectedVehicle.loadCapacity}吨</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">车架号：</span>
                    <span className="font-medium text-neutral-800">{selectedVehicle.vin}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">发动机号：</span>
                    <span className="font-medium text-neutral-800">{selectedVehicle.engineNumber}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">购买日期：</span>
                    <span className="font-medium text-neutral-800">
                      {formatDate(selectedVehicle.purchaseDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">当前状态：</span>
                    {getStatusBadge(selectedVehicle.status)}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1 h-5 bg-warning-500 rounded-full" />
                  证件信息
                </h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">行驶证有效期</span>
                    <div className="text-right">
                      <span className="font-medium text-neutral-800">
                        {formatDate(selectedVehicle.operationLicenseExpiry)}
                      </span>
                      <div className="mt-1">
                        {(() => {
                          const status = getExpiryStatus(selectedVehicle.operationLicenseExpiry);
                          return <StatusBadge variant={status.variant}>{status.text}</StatusBadge>;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">保险有效期</span>
                    <div className="text-right">
                      <span className="font-medium text-neutral-800">
                        {formatDate(selectedVehicle.insuranceExpiry)}
                      </span>
                      <div className="mt-1">
                        {(() => {
                          const status = getExpiryStatus(selectedVehicle.insuranceExpiry);
                          return <StatusBadge variant={status.variant}>{status.text}</StatusBadge>;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">年检有效期</span>
                    <div className="text-right">
                      <span className="font-medium text-neutral-800">
                        {formatDate(selectedVehicle.inspectionExpiry)}
                      </span>
                      <div className="mt-1">
                        {(() => {
                          const status = getExpiryStatus(selectedVehicle.inspectionExpiry);
                          return <StatusBadge variant={status.variant}>{status.text}</StatusBadge>;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">环保标志有效期</span>
                    <div className="text-right">
                      <span className="font-medium text-neutral-800">
                        {formatDate(selectedVehicle.environmentalExpiry)}
                      </span>
                      <div className="mt-1">
                        {(() => {
                          const status = getExpiryStatus(selectedVehicle.environmentalExpiry);
                          return <StatusBadge variant={status.variant}>{status.text}</StatusBadge>;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <div className="w-1 h-5 bg-success-500 rounded-full" />
                最近维护记录
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-2 text-neutral-600 font-medium">维护日期</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">维护类型</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">维护内容</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">维护机构</th>
                      <th className="text-right py-2 text-neutral-600 font-medium">费用</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVehicle.maintenanceRecords.slice(0, 3).map((record) => (
                      <tr key={record.id} className="border-b border-neutral-100">
                        <td className="py-3">{formatDate(record.date)}</td>
                        <td className="py-3">{record.type}</td>
                        <td className="py-3">{record.description}</td>
                        <td className="py-3">{record.organization}</td>
                        <td className="py-3 text-right">¥{record.cost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteConfirm && selectedVehicle && (
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
              确定要删除车辆 {selectedVehicle.plateNumber} 吗？
            </p>
            <p className="text-sm text-neutral-500 mt-2">此操作不可撤销，相关数据将被永久删除</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
