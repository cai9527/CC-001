import { useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Eye, MapPin, Clock, Truck } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import DataTable from '@/components/UI/DataTable';
import StatusBadge from '@/components/UI/StatusBadge';
import Modal from '@/components/UI/Modal';
import { TASK_STATUS } from '@/types';
import { formatDate, formatDateTime, formatWeight, classNames } from '@/utils';
import type { TransportTask } from '@/types';

export default function TasksPage() {
  const { tasks, loading, deleteTask } = useTaskStore();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TransportTask | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const pageSize = 10;

  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      t.taskNo.includes(searchText) ||
      t.vehiclePlate.includes(searchText) ||
      t.driverName.includes(searchText) ||
      t.material.includes(searchText);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pagedTasks = filteredTasks.slice((page - 1) * pageSize, page * pageSize);

  const handleViewDetail = (task: TransportTask) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleDelete = (task: TransportTask) => {
    setSelectedTask(task);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedTask) {
      deleteTask(selectedTask.id);
      setShowDeleteConfirm(false);
      setSelectedTask(null);
    }
  };

  const getStatusBadge = (status: TransportTask['status']) => {
    const config = TASK_STATUS[status];
    return <StatusBadge variant={config.color as any}>{config.label}</StatusBadge>;
  };

  const getProgress = (task: TransportTask) => {
    if (task.status === 'completed') return 100;
    if (task.status === 'cancelled') return 0;
    if (task.actualTrips === 0) return 10;
    return Math.round((task.actualTrips / task.plannedTrips) * 100);
  };

  const columns = [
    {
      key: 'taskNo',
      title: '任务编号',
      width: '130px',
      render: (row: TransportTask) => (
        <span className="font-medium text-primary-600">{row.taskNo}</span>
      ),
    },
    {
      key: 'material',
      title: '运输物料',
      width: '100px',
      render: (row: TransportTask) => row.material,
    },
    {
      key: 'vehiclePlate',
      title: '车辆',
      width: '110px',
      render: (row: TransportTask) => (
        <div className="flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-800">{row.vehiclePlate}</span>
        </div>
      ),
    },
    {
      key: 'driverName',
      title: '驾驶员',
      width: '90px',
      render: (row: TransportTask) => row.driverName,
    },
    {
      key: 'route',
      title: '运输路线',
      width: '200px',
      render: (row: TransportTask) => (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-neutral-800 truncate">{row.fromLocation}</div>
            <div className="flex items-center gap-1.5 text-neutral-500">
              <div className="w-0.5 h-2 bg-neutral-300" />
              <MapPin className="w-3.5 h-3.5 text-danger-500" />
            </div>
            <div className="text-neutral-800 truncate">{row.toLocation}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'plannedQuantity',
      title: '计划/实际',
      width: '120px',
      render: (row: TransportTask) => (
        <div className="text-sm">
          <div className="text-neutral-800">{formatWeight(row.actualQuantity)}</div>
          <div className="text-neutral-500 text-xs">计划: {formatWeight(row.plannedQuantity)}</div>
        </div>
      ),
    },
    {
      key: 'progress',
      title: '进度',
      width: '120px',
      render: (row: TransportTask) => {
        const progress = getProgress(row);
        return (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-600">
                {row.actualTrips}/{row.plannedTrips}趟
              </span>
              <span className="font-medium text-primary-600">{progress}%</span>
            </div>
            <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (row: TransportTask) => getStatusBadge(row.status),
    },
    {
      key: 'scheduledDate',
      title: '计划日期',
      width: '100px',
      render: (row: TransportTask) => formatDate(row.scheduledDate),
    },
    {
      key: 'operation',
      title: '操作',
      width: '120px',
      render: (row: TransportTask) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewDetail(row)}
            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold text-neutral-800">任务调度</h1>
          <p className="text-sm text-neutral-500 mt-1">管理运输任务的分配、跟踪和进度监控</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-default">实时跟踪</button>
          <button className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新增任务
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(TASK_STATUS).map(([key, val]) => {
          const count = tasks.filter((t) => t.status === key).length;
          return (
            <div key={key} className="card p-4 flex items-center gap-3">
              <div
                className={classNames(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  val.color === 'primary' && 'bg-primary-100 text-primary-600',
                  val.color === 'success' && 'bg-success-100 text-success-600',
                  val.color === 'warning' && 'bg-warning-100 text-warning-600',
                  val.color === 'danger' && 'bg-danger-100 text-danger-600',
                  val.color === 'neutral' && 'bg-neutral-100 text-neutral-600'
                )}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-800">{count}</div>
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
              placeholder="搜索任务编号、车牌号、驾驶员、物料..."
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
              {Object.entries(TASK_STATUS).map(([key, val]) => (
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
        data={pagedTasks}
        loading={loading}
        pagination={{
          page,
          pageSize,
          total: filteredTasks.length,
          onPageChange: setPage,
        }}
      />

      {showDetailModal && selectedTask && (
        <Modal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="任务详情"
          size="xl"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-neutral-800">{selectedTask.taskNo}</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  创建于 {formatDateTime(selectedTask.createdAt)}
                </p>
              </div>
              {getStatusBadge(selectedTask.status)}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary-500 rounded-full" />
                  基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-500">运输物料：</span>
                    <span className="font-medium text-neutral-800">{selectedTask.material}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">计划日期：</span>
                    <span className="font-medium text-neutral-800">
                      {formatDate(selectedTask.scheduledDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">计划趟数：</span>
                    <span className="font-medium text-neutral-800">{selectedTask.plannedTrips}趟</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">实际趟数：</span>
                    <span className="font-medium text-neutral-800">{selectedTask.actualTrips}趟</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">计划方量：</span>
                    <span className="font-medium text-neutral-800">
                      {formatWeight(selectedTask.plannedQuantity)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">实际方量：</span>
                    <span className="font-medium text-neutral-800">
                      {formatWeight(selectedTask.actualQuantity)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1 h-5 bg-warning-500 rounded-full" />
                  运输资源
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-500">车辆：</span>
                    <span className="font-medium text-neutral-800">{selectedTask.vehiclePlate}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">驾驶员：</span>
                    <span className="font-medium text-neutral-800">{selectedTask.driverName}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-neutral-500">预计运输距离：</span>
                    <span className="font-medium text-neutral-800">{selectedTask.distance}公里</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <div className="w-1 h-5 bg-success-500 rounded-full" />
                运输路线
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-primary-600" />
                    </div>
                    <span className="text-sm font-medium text-neutral-600">装料点</span>
                  </div>
                  <p className="text-neutral-800">{selectedTask.fromLocation}</p>
                </div>
                <div className="card p-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{selectedTask.distance}</div>
                    <div className="text-xs text-neutral-500">公里</div>
                  </div>
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-danger-100 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-danger-600" />
                    </div>
                    <span className="text-sm font-medium text-neutral-600">卸料点</span>
                  </div>
                  <p className="text-neutral-800">{selectedTask.toLocation}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary-500 rounded-full" />
                运输记录
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-2 text-neutral-600 font-medium">序号</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">装料时间</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">卸料时间</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">毛重</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">皮重</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">净重</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTask.transportRecords.map((record, index) => (
                      <tr key={record.id} className="border-b border-neutral-100">
                        <td className="py-3">{index + 1}</td>
                        <td className="py-3">{formatDateTime(record.loadTime)}</td>
                        <td className="py-3">{formatDateTime(record.unloadTime)}</td>
                        <td className="py-3">{formatWeight(record.grossWeight)}</td>
                        <td className="py-3">{formatWeight(record.tareWeight)}</td>
                        <td className="py-3 font-medium text-primary-600">
                          {formatWeight(record.netWeight)}
                        </td>
                        <td className="py-3">
                          <StatusBadge variant="success">已完成</StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteConfirm && selectedTask && (
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
              确定要删除任务 {selectedTask.taskNo} 吗？
            </p>
            <p className="text-sm text-neutral-500 mt-2">此操作不可撤销，相关数据将被永久删除</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
