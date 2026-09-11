import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Gauge,
  Clock,
  Weight,
  Route,
  Radio,
  MapPin,
  Siren,
  ShieldCheck,
  CalendarClock,
  ListChecks,
  Download,
} from 'lucide-react';
import { useSafetyStore } from '@/store/useSafetyStore';
import { toast } from '@/store/useToastStore';
import DataTable from '@/components/UI/DataTable';
import StatusBadge from '@/components/UI/StatusBadge';
import ProcessWarningModal from './ProcessWarningModal';
import {
  ALERT_LEVEL,
  ALERT_STATUS,
  ALERT_TYPE,
  ALERT_SOURCE,
} from '@/types';
import { formatDateTime, classNames, exportToCSV } from '@/utils';
import type { SafetyAlert } from '@/types';
import WarningDetailModal from './WarningDetailModal';

const TYPE_ICONS: Record<SafetyAlert['type'], React.ElementType> = {
  speeding: Gauge,
  fatigue: Clock,
  violation: AlertTriangle,
  overload: Weight,
  route_deviation: Route,
  device: Radio,
};

export default function WarningPage() {
  const { alerts, loading, batchProcessAlerts } = useSafetyStore();
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailAlert, setDetailAlert] = useState<SafetyAlert | null>(null);
  const [processAlert, setProcessAlert] = useState<SafetyAlert | null>(null);
  const [batchProcessOpen, setBatchProcessOpen] = useState(false);
  const pageSize = 10;
  const keyword = searchText.trim();

  const sortedAlerts = useMemo(
    () =>
      [...alerts].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [alerts]
  );

  const filteredAlerts = useMemo(
    () =>
      sortedAlerts.filter((a) => {
        const matchSearch =
          !keyword ||
          a.vehiclePlate?.includes(keyword) ||
          a.driverName?.includes(keyword) ||
          a.description.includes(keyword) ||
          a.warningNo?.includes(keyword);
        return (
          matchSearch &&
          (typeFilter === 'all' || a.type === typeFilter) &&
          (levelFilter === 'all' || a.level === levelFilter) &&
          (statusFilter === 'all' || a.status === statusFilter) &&
          (sourceFilter === 'all' || a.source === sourceFilter)
        );
      }),
    [sortedAlerts, keyword, typeFilter, levelFilter, statusFilter, sourceFilter]
  );

  const pagedAlerts = filteredAlerts.slice((page - 1) * pageSize, page * pageSize);
  const pendingAlerts = alerts.filter((a) => a.status === 'pending');
  const urgentCount = pendingAlerts.filter(
    (a) => a.level === 'critical' || a.level === 'high'
  ).length;
  const processedCount = alerts.filter((a) => a.status === 'processed').length;
  const processRate = alerts.length
    ? Math.round((processedCount / alerts.length) * 100)
    : 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = alerts.filter((a) => a.timestamp.startsWith(todayStr)).length;

  const selectablePendingIds = pagedAlerts
    .filter((a) => a.status === 'pending')
    .map((a) => a.id);
  const allPageSelected =
    selectablePendingIds.length > 0 &&
    selectablePendingIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !selectablePendingIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...selectablePendingIds])));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setSearchText('');
    setTypeFilter('all');
    setLevelFilter('all');
    setStatusFilter('all');
    setSourceFilter('all');
    setPage(1);
  };

  const handleExport = () => {
    const rows = filteredAlerts.map((a) => ({
      预警编号: a.warningNo || a.id,
      类型: ALERT_TYPE[a.type].label,
      级别: ALERT_LEVEL[a.level].label,
      来源: ALERT_SOURCE[a.source]?.label || '-',
      车牌号: a.vehiclePlate || '',
      驾驶员: a.driverName || '',
      描述: a.description,
      位置: a.location?.address || '',
      发生时间: formatDateTime(a.timestamp),
      状态: ALERT_STATUS[a.status].label,
      处理人: a.processedBy || '',
      处理时间: a.processedAt ? formatDateTime(a.processedAt) : '',
      处理结果: a.handleResult || '',
      处理措施: a.handleMeasure || '',
    }));
    exportToCSV(rows, `预警列表_${todayStr}`);
    toast.success(`已导出 ${rows.length} 条预警记录`);
  };

  const handleBatchProcessed = async (data: {
    status: 'processed' | 'ignored';
    handleResult?: SafetyAlert['handleResult'];
    handleMeasure?: string;
    remark?: string;
  }) => {
    const count = await batchProcessAlerts(selectedIds, data.status, data);
    setBatchProcessOpen(false);
    setSelectedIds([]);
    toast.success(
      data.status === 'processed'
        ? `批量处理完成，共处理 ${count} 条预警`
        : `已忽略 ${count} 条预警`
    );
  };

  const getLevelBadge = (level: SafetyAlert['level']) => {
    const config = ALERT_LEVEL[level];
    return (
      <StatusBadge variant={config.color as any} className={level === 'critical' ? 'animate-pulse' : ''}>
        {config.label}
      </StatusBadge>
    );
  };

  const getLevelIcon = (level: SafetyAlert['level']) => {
    const Icon =
      level === 'low' ? AlertCircle : level === 'medium' ? AlertTriangle : AlertTriangle;
    return (
      <Icon
        className={classNames(
          'w-5 h-5',
          level === 'critical' || level === 'high' ? 'text-danger-500' : 'text-warning-500'
        )}
      />
    );
  };

  const columns = [
    {
      key: 'checkbox',
      title: (
        <input
          type="checkbox"
          checked={allPageSelected}
          onChange={toggleSelectAll}
          disabled={selectablePendingIds.length === 0}
          className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 cursor-pointer disabled:opacity-40"
        />
      ),
      width: '44px',
      render: (row: SafetyAlert) =>
        row.status === 'pending' ? (
          <input
            type="checkbox"
            checked={selectedIds.includes(row.id)}
            onChange={() => toggleSelect(row.id)}
            className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
          />
        ) : (
          <span className="inline-block w-4 h-4" />
        ),
    },
    {
      key: 'warningNo',
      title: '预警编号',
      width: '140px',
      render: (row: SafetyAlert) => (
        <span className="font-medium text-primary-600">{row.warningNo || row.id}</span>
      ),
    },
    {
      key: 'level',
      title: '级别',
      width: '70px',
      render: (row: SafetyAlert) => (
        <div className="flex items-center gap-1.5">
          {getLevelIcon(row.level)}
          {getLevelBadge(row.level)}
        </div>
      ),
    },
    {
      key: 'type',
      title: '类型',
      width: '100px',
      render: (row: SafetyAlert) => {
        const Icon = TYPE_ICONS[row.type];
        return (
          <div className="flex items-center gap-1.5">
            <Icon className="w-4 h-4 text-neutral-500" />
            <span className="text-sm text-neutral-700">{ALERT_TYPE[row.type].label}</span>
          </div>
        );
      },
    },
    {
      key: 'vehiclePlate',
      title: '车牌号',
      width: '100px',
      render: (row: SafetyAlert) => (
        <span className="font-medium text-neutral-800">{row.vehiclePlate}</span>
      ),
    },
    {
      key: 'driverName',
      title: '驾驶员',
      width: '80px',
      render: (row: SafetyAlert) => row.driverName || '-',
    },
    {
      key: 'source',
      title: '来源',
      width: '100px',
      render: (row: SafetyAlert) => (
        <span className="text-sm text-neutral-600">
          {ALERT_SOURCE[row.source]?.label || '-'}
        </span>
      ),
    },
    {
      key: 'description',
      title: '预警描述',
      render: (row: SafetyAlert) => (
        <span className="text-neutral-700 line-clamp-2">{row.description}</span>
      ),
    },
    {
      key: 'location',
      title: '位置',
      width: '150px',
      render: (row: SafetyAlert) => (
        <div className="flex items-center gap-1 text-sm text-neutral-600">
          <MapPin className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          <span className="truncate">{row.location?.address || '-'}</span>
        </div>
      ),
    },
    {
      key: 'timestamp',
      title: '发生时间',
      width: '160px',
      render: (row: SafetyAlert) => formatDateTime(row.timestamp),
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (row: SafetyAlert) => {
        const config = ALERT_STATUS[row.status];
        return <StatusBadge variant={config.color as any}>{config.label}</StatusBadge>;
      },
    },
    {
      key: 'operation',
      title: '操作',
      width: '110px',
      render: (row: SafetyAlert) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDetailAlert(row)}
            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'pending' && (
            <button
              onClick={() => setProcessAlert(row)}
              className="p-1.5 text-success-600 hover:bg-success-50 rounded transition-colors"
              title="处理预警"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {row.status !== 'pending' && (
            <CheckCircle className="w-4 h-4 m-1.5 text-neutral-300" />
          )}
        </div>
      ),
    },
  ];

  const statCards = [
    {
      label: '待处理预警',
      value: pendingAlerts.length,
      unit: '条',
      icon: <Siren className="w-6 h-6" />,
      iconBg: 'bg-danger-100',
      iconColor: 'text-danger-600',
      filter: 'pending',
    },
    {
      label: '紧急预警(高/严重)',
      value: urgentCount,
      unit: '条',
      icon: <AlertTriangle className="w-6 h-6" />,
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-600',
    },
    {
      label: '今日新增预警',
      value: todayCount,
      unit: '条',
      icon: <CalendarClock className="w-6 h-6" />,
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
    },
    {
      label: '预警处理率',
      value: processRate,
      unit: '%',
      icon: <ShieldCheck className="w-6 h-6" />,
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600',
      filter: 'processed',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">预警管理</h1>
          <p className="text-sm text-neutral-500 mt-1">
            集中查看各类安全预警，完成预警核实、处置与闭环跟踪
          </p>
        </div>
        <button onClick={handleExport} className="btn btn-default">
          <Download className="w-4 h-4" />
          导出预警
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <button
            key={card.label}
            onClick={() => {
              setStatusFilter(card.filter || 'all');
              setPage(1);
            }}
            className="card p-4 flex items-center gap-3 text-left hover:shadow-md transition-shadow"
          >
            <div
              className={classNames(
                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                card.iconBg
              )}
            >
              <span className={card.iconColor}>{card.icon}</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-800">
                {card.value}
                <span className="text-sm font-normal text-neutral-500 ml-1">{card.unit}</span>
              </div>
              <div className="text-sm text-neutral-500">{card.label}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索预警编号、车牌号、驾驶员、描述..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              <option value="all">全部类型</option>
              {Object.entries(ALERT_TYPE).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setPage(1);
              }}
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
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              <option value="all">全部状态</option>
              {Object.entries(ALERT_STATUS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              <option value="all">全部来源</option>
              {Object.entries(ALERT_SOURCE).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm text-neutral-600 hover:text-primary-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="card p-3 px-4 flex items-center gap-4 border-primary-200 bg-primary-50/50">
          <ListChecks className="w-5 h-5 text-primary-600" />
          <span className="text-sm text-neutral-700">
            已选择 <span className="font-semibold text-primary-600">{selectedIds.length}</span> 条待处理预警
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setBatchProcessOpen(true)} className="btn btn-primary py-1.5">
              <CheckCircle className="w-4 h-4" />
              批量处理
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-800"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

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

      <WarningDetailModal
        alert={detailAlert}
        open={!!detailAlert}
        onClose={() => setDetailAlert(null)}
        onProcess={(alert) => {
          setDetailAlert(null);
          setProcessAlert(alert);
        }}
      />

      <ProcessWarningModal
        open={!!processAlert}
        alert={processAlert}
        onClose={() => setProcessAlert(null)}
      />

      <ProcessWarningModal
        open={batchProcessOpen}
        batch
        count={selectedIds.length}
        onClose={() => setBatchProcessOpen(false)}
        onSubmit={handleBatchProcessed}
      />
    </div>
  );
}
