import { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useStatisticsStore } from '@/store/useStatisticsStore';
import StatusBadge from '@/components/UI/StatusBadge';
import { formatDateTime, formatNumber } from '@/utils';

export default function BackupPage() {
  const { backupData, restoreData } = useStatisticsStore();
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupHistory, setBackupHistory] = useState([
    {
      id: '1',
      name: 'backup_20250711_120000',
      type: '自动备份',
      size: 15.6,
      status: 'success',
      createdAt: '2025-07-11 12:00:00',
    },
    {
      id: '2',
      name: 'backup_20250710_120000',
      type: '自动备份',
      size: 15.4,
      status: 'success',
      createdAt: '2025-07-10 12:00:00',
    },
    {
      id: '3',
      name: 'backup_20250709_183000',
      type: '手动备份',
      size: 15.2,
      status: 'success',
      createdAt: '2025-07-09 18:30:00',
    },
    {
      id: '4',
      name: 'backup_20250708_120000',
      type: '自动备份',
      size: 15.0,
      status: 'success',
      createdAt: '2025-07-08 12:00:00',
    },
    {
      id: '5',
      name: 'backup_20250707_120000',
      type: '自动备份',
      size: 14.8,
      status: 'failed',
      createdAt: '2025-07-07 12:00:00',
    },
  ]);

  const handleBackup = async () => {
    setBackingUp(true);
    setTimeout(() => {
      backupData();
      const newBackup = {
        id: String(Date.now()),
        name: `backup_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${new Date().toTimeString().slice(0, 8).replace(/:/g, '')}`,
        type: '手动备份',
        size: Math.random() * 5 + 15,
        status: 'success' as const,
        createdAt: formatDateTime(new Date().toISOString()),
      };
      setBackupHistory((prev) => [newBackup, ...prev]);
      setBackingUp(false);
    }, 2000);
  };

  const handleRestore = (id: string) => {
    setRestoring(true);
    setTimeout(async () => {
      await restoreData(id);
      setRestoring(false);
    }, 2000);
  };

  const dbStats = {
    totalRecords: 125847,
    tableCount: 32,
    dataSize: 156.8,
    indexSize: 23.4,
  };

  const autoBackupConfig = {
    enabled: true,
    schedule: '每天 12:00',
    retentionDays: 30,
    backupLocation: '本地存储 + 云端同步',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">数据备份与恢复</h1>
          <p className="text-sm text-neutral-500 mt-1">管理系统数据的备份、恢复和存储配置</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackup}
            disabled={backingUp}
            className="btn btn-primary flex items-center gap-2"
          >
            {backingUp ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {backingUp ? '备份中...' : '立即备份'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Database className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-800">{formatNumber(dbStats.totalRecords)}</div>
              <div className="text-sm text-neutral-500">总数据记录数</div>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-800">{dbStats.dataSize} MB</div>
              <div className="text-sm text-neutral-500">数据文件大小</div>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning-100 flex items-center justify-center">
              <Settings className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-800">{dbStats.tableCount}</div>
              <div className="text-sm text-neutral-500">数据表数量</div>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-info flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-800">30</div>
              <div className="text-sm text-neutral-500">备份保留天数</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-neutral-800 mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-500" />
            自动备份配置
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-neutral-100">
              <div>
                <p className="font-medium text-neutral-800">自动备份</p>
                <p className="text-sm text-neutral-500">开启后将按照设定时间自动备份数据</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge variant={autoBackupConfig.enabled ? 'success' : 'danger'}>
                  {autoBackupConfig.enabled ? '已开启' : '已关闭'}
                </StatusBadge>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-neutral-100">
              <div>
                <p className="font-medium text-neutral-800">备份计划</p>
                <p className="text-sm text-neutral-500">自动备份的执行时间</p>
              </div>
              <span className="font-medium text-neutral-800">{autoBackupConfig.schedule}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-neutral-100">
              <div>
                <p className="font-medium text-neutral-800">保留天数</p>
                <p className="text-sm text-neutral-500">自动备份文件的保留时长</p>
              </div>
              <span className="font-medium text-neutral-800">{autoBackupConfig.retentionDays} 天</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-neutral-800">存储位置</p>
                <p className="text-sm text-neutral-500">备份文件的存储方式</p>
              </div>
              <span className="font-medium text-neutral-800">{autoBackupConfig.backupLocation}</span>
            </div>
          </div>
          <button className="btn btn-default w-full mt-6 flex items-center justify-center gap-2">
            <Settings className="w-4 h-4" />
            修改配置
          </button>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-neutral-800 mb-6 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary-500" />
            恢复数据
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning-800">重要提示</p>
                  <p className="text-sm text-warning-700 mt-1">
                    恢复操作将覆盖当前所有数据，请确保已备份最新数据。建议在恢复前先进行一次手动备份。
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700">选择备份文件</label>
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
                <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600">点击或拖拽备份文件到此处</p>
                <p className="text-sm text-neutral-500 mt-1">支持 .sql, .bak, .zip 格式</p>
              </div>
            </div>
            <button
              onClick={() => handleRestore('b001')}
              disabled={restoring}
              className="btn btn-warning w-full flex items-center justify-center gap-2"
            >
              {restoring ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {restoring ? '恢复中...' : '开始恢复'}
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-neutral-800 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-500" />
          备份历史记录
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 text-neutral-600 font-medium">备份名称</th>
                <th className="text-left py-3 px-4 text-neutral-600 font-medium">备份类型</th>
                <th className="text-left py-3 px-4 text-neutral-600 font-medium">文件大小</th>
                <th className="text-left py-3 px-4 text-neutral-600 font-medium">状态</th>
                <th className="text-left py-3 px-4 text-neutral-600 font-medium">备份时间</th>
                <th className="text-right py-3 px-4 text-neutral-600 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {backupHistory.map((backup) => (
                <tr key={backup.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-4 px-4 font-medium text-neutral-800">{backup.name}</td>
                  <td className="py-4 px-4">
                    <StatusBadge variant={backup.type === '手动备份' ? 'primary' : 'info'}>
                      {backup.type}
                    </StatusBadge>
                  </td>
                  <td className="py-4 px-4 text-neutral-700">{backup.size.toFixed(1)} MB</td>
                  <td className="py-4 px-4">
                    {backup.status === 'success' ? (
                      <div className="flex items-center gap-1.5 text-success-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>成功</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-danger-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>失败</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-neutral-600">{backup.createdAt}</td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        下载
                      </button>
                      <button
                        onClick={() => handleRestore(backup.id)}
                        className="text-warning-600 hover:text-warning-700 text-sm font-medium"
                      >
                        恢复
                      </button>
                      <button className="text-danger-600 hover:text-danger-700 text-sm font-medium">
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
