import { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Gauge,
  Clock,
  MapPin,
  Video,
} from 'lucide-react';
import { useSafetyStore } from '@/store/useSafetyStore';
import DataTable from '@/components/UI/DataTable';
import StatusBadge from '@/components/UI/StatusBadge';
import Modal from '@/components/UI/Modal';
import { ALERT_LEVEL, ALERT_STATUS, ALERT_TYPE } from '@/types';
import { formatDateTime, classNames } from '@/utils';
import type { SafetyAlert } from '@/types';

export default function SafetyPage() {
  const { alerts, loading, processAlert } = useSafetyStore();
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processNote, setProcessNote] = useState('');
  const pageSize = 10;

  const filteredAlerts = alerts.filter((a) => {
    const matchSearch =
      a.vehiclePlate.includes(searchText) ||
      a.driverName.includes(searchText) ||
      a.description.includes(searchText);
    const matchLevel = levelFilter === 'all' || a.level === levelFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchLevel && matchStatus;
  });

  const pagedAlerts = filteredAlerts.slice((page - 1) * pageSize, page * pageSize);

  const pendingCount = alerts.filter((a) => a.status === 'pending').length;
  const speedingCount = alerts.filter((a) => a.type === 'speeding').length;
  const fatigueCount = alerts.filter((a) => a.type === 'fatigue').length;
  const violationCount = alerts.filter((a) => a.type === 'violation').length;

  const handleViewDetail = (alert: SafetyAlert) => {
    setSelectedAlert(alert);
    setShowDetailModal(true);
  };

  const handleProcess = (alert: SafetyAlert) => {
    setSelectedAlert(alert);
    setShowProcessModal(true);
    setProcessNote('');
  };

  const confirmProcess = (result: 'processed' | 'ignored') => {
    if (selectedAlert) {
      processAlert(selectedAlert.id, result, processNote);
      setShowProcessModal(false);
      setSelectedAlert(null);
    }
  };

  const getLevelBadge = (level: SafetyAlert['level']) => {
    const config = ALERT_LEVEL[level];
    return <StatusBadge variant={config.color as any}>{config.label}</StatusBadge>;
  };

  const getTypeBadge = (type: SafetyAlert['type']) => {
    const config = ALERT_TYPE[type];
    return <StatusBadge variant={config.color as any}>{config.label}</StatusBadge>;
  };

  const getStatusBadge = (status: SafetyAlert['status']) => {
    const config = ALERT_STATUS[status];
    return <StatusBadge variant={config.color as any}>{config.label}</StatusBadge>;
  };

  const getLevelIcon = (level: SafetyAlert['level']) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="w-6 h-6 text-danger-500" />;
      case 'high':
        return <AlertTriangle className="w-6 h-6 text-danger-500" />;
      case 'medium':
        return <AlertTriangle className="w-6 h-6 text-warning-500" />;
      case 'low':
        return <AlertCircle className="w-6 h-6 text-warning-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-neutral-500" />;
    }
  };

  const columns = [
    {
      key: 'level',
      title: '级别',
      width: '60px',
      render: (row: SafetyAlert) => (
        <div className="flex justify-center">{getLevelIcon(row.level)}</div>
      ),
    },
    {
      key: 'type',
      title: '类型',
      width: '100px',
      render: (row: SafetyAlert) => getTypeBadge(row.type),
    },
    {
      key: 'vehiclePlate',
      title: '车牌号',
      width: '110px',
      render: (row: SafetyAlert) => (
        <span className="font-medium text-neutral-800">{row.vehiclePlate}</span>
      ),
    },
    {
      key: 'driverName',
      title: '驾驶员',
      width: '90px',
      render: (row: SafetyAlert) => row.driverName,
    },
    {
      key: 'description',
      title: '预警描述',
      render: (row: SafetyAlert) => (
        <span className="text-neutral-700 line-clamp-2">{row.description}</span>
      ),
    },
    {
      key: 'value',
      title: '数值',
      width: '100px',
      render: (row: SafetyAlert) => {
        if (row.type === 'speeding') {
          return (
            <div className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-danger-500" />
              <span className="font-medium text-danger-600">{row.speed}km/h</span>
            </div>
          );
        }
        if (row.type === 'fatigue') {
          return (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-warning-500" />
              <span className="font-medium text-warning-600">{row.duration}小时</span>
            </div>
          );
        }
        return '-';
      },
    },
    {
      key: 'location',
      title: '位置',
      width: '140px',
      render: (row: SafetyAlert) => (
        <div className="flex items-center gap-1 text-sm text-neutral-600">
          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
          <span className="truncate">{row.location?.address || '-'}</span>
        </div>
      ),
    },
    {
      key: 'timestamp',
      title: '时间',
      width: '150px',
      render: (row: SafetyAlert) => formatDateTime(row.timestamp),
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (row: SafetyAlert) => getStatusBadge(row.status),
    },
    {
      key: 'operation',
      title: '操作',
      width: '120px',
      render: (row: SafetyAlert) => (
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
            title="查看视频"
          >
            <Video className="w-4 h-4" />
          </button>
          {row.status === 'pending' && (
            <button
              onClick={() => handleProcess(row)}
              className="p-1.5 text-success-600 hover:bg-success-50 rounded transition-colors"
              title="处理"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">安全监控</h1>
          <p className="text-sm text-neutral-500 mt-1">实时监控车辆安全状态，处理安全预警信息</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-danger-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-danger-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-800">{pendingCount}</div>
            <div className="text-sm text-neutral-500">待处理预警</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-warning-100 flex items-center justify-center">
            <Gauge className="w-6 h-6 text-warning-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-800">{speedingCount}</div>
            <div className="text-sm text-neutral-500">超速预警</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-800">{fatigueCount}</div>
            <div className="text-sm text-neutral-500">疲劳驾驶</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-danger-100 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-danger-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-800">{violationCount}</div>
            <div className="text-sm text-neutral-500">违规行为</div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索车牌号、驾驶员、预警描述..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              <option value="all">全部级别</option>
              {Object.entries(ALERT_LEVEL).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              <option value="all">全部状态</option>
              {Object.entries(ALERT_STATUS).map(([key, val]) => (
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
        data={pagedAlerts}
        loading={loading}
        pagination={{
          page,
          pageSize,
          total: filteredAlerts.length,
          onPageChange: setPage,
        }}
      />

      {showDetailModal && selectedAlert && (
        <Modal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="预警详情"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div
                className={classNames(
                  'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                  selectedAlert.level === 'critical' || selectedAlert.level === 'high'
                    ? 'bg-danger-100'
                    : 'bg-warning-100'
                )}
              >
                {getLevelIcon(selectedAlert.level)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getLevelBadge(selectedAlert.level)}
                  {getTypeBadge(selectedAlert.type)}
                  {getStatusBadge(selectedAlert.status)}
                </div>
                <p className="text-lg font-medium text-neutral-800">{selectedAlert.description}</p>
                <p className="text-sm text-neutral-500 mt-1">
                  {formatDateTime(selectedAlert.timestamp)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary-500 rounded-full" />
                  预警信息
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">预警类型</span>
                    <span className="font-medium text-neutral-800">
                      {ALERT_TYPE[selectedAlert.type]?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">预警级别</span>
                    <span className="font-medium text-neutral-800">
                      {ALERT_LEVEL[selectedAlert.level]?.label}
                    </span>
                  </div>
                  {selectedAlert.type === 'speeding' && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">当前车速</span>
                      <span className="font-medium text-danger-600">{selectedAlert.speed} km/h</span>
                    </div>
                  )}
                  {selectedAlert.type === 'fatigue' && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">连续驾驶时长</span>
                      <span className="font-medium text-warning-600">{selectedAlert.duration} 小时</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">发生位置</span>
                    <span className="font-medium text-neutral-800">{selectedAlert.location?.address || '-'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1 h-5 bg-warning-500 rounded-full" />
                  关联信息
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">车牌号</span>
                    <span className="font-medium text-primary-600">{selectedAlert.vehiclePlate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">驾驶员</span>
                    <span className="font-medium text-neutral-800">{selectedAlert.driverName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">所属车队</span>
                    <span className="font-medium text-neutral-800">第一车队</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedAlert.status !== 'pending' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1 h-5 bg-success-500 rounded-full" />
                  处理记录
                </h3>
                <div className="card p-4 bg-neutral-50">
                  <div className="flex items-center gap-3 mb-2">
                    {selectedAlert.status === 'processed' ? (
                      <CheckCircle className="w-5 h-5 text-success-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-neutral-500" />
                    )}
                    <span className="font-medium text-neutral-800">
                      {selectedAlert.status === 'processed' ? '已处理' : '已忽略'}
                    </span>
                    <span className="text-sm text-neutral-500 ml-auto">
                      {formatDateTime(selectedAlert.processedAt!)}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600">处理人：{selectedAlert.processedBy}</p>
                  {selectedAlert.remark && (
                    <p className="text-sm text-neutral-600 mt-2">
                      处理备注：{selectedAlert.remark}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showProcessModal && selectedAlert && (
        <Modal
          open={showProcessModal}
          onClose={() => setShowProcessModal(false)}
          title="处理预警"
          size="md"
          footer={
            <>
              <button
                onClick={() => setShowProcessModal(false)}
                className="btn btn-default"
              >
                取消
              </button>
              <button
                onClick={() => confirmProcess('ignored')}
                className="btn btn-default"
              >
                <XCircle className="w-4 h-4" />
                忽略
              </button>
              <button
                onClick={() => confirmProcess('processed')}
                className="btn btn-primary"
              >
                <CheckCircle className="w-4 h-4" />
                确认处理
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              {getLevelIcon(selectedAlert.level)}
              <div>
                <p className="font-medium text-neutral-800">{selectedAlert.description}</p>
                <p className="text-sm text-neutral-500">
                  {selectedAlert.vehiclePlate} - {selectedAlert.driverName}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                处理备注
              </label>
              <textarea
                value={processNote}
                onChange={(e) => setProcessNote(e.target.value)}
                placeholder="请输入处理备注信息..."
                rows={4}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
