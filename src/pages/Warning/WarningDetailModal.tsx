import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Gauge,
  Clock,
  Weight,
  MapPin,
  Siren,
  User,
  Truck,
  Satellite,
  CalendarClock,
  ClipboardCheck,
} from 'lucide-react';
import Modal from '@/components/UI/Modal';
import StatusBadge from '@/components/UI/StatusBadge';
import {
  ALERT_LEVEL,
  ALERT_TYPE,
  ALERT_STATUS,
  ALERT_SOURCE,
  ALERT_HANDLE_RESULT,
} from '@/types';
import { formatDateTime, classNames } from '@/utils';
import type { SafetyAlert } from '@/types';

interface WarningDetailModalProps {
  open: boolean;
  alert: SafetyAlert | null;
  onClose: () => void;
  onProcess?: (alert: SafetyAlert) => void;
}

export default function WarningDetailModal({
  open,
  alert,
  onClose,
  onProcess,
}: WarningDetailModalProps) {
  if (!alert) return null;

  const levelConfig = ALERT_LEVEL[alert.level];
  const isUrgent = alert.level === 'critical' || alert.level === 'high';

  const infoRow = (label: string, value: React.ReactNode) => (
    <div className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-neutral-800 text-right">{value}</span>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="预警详情"
      size="lg"
      footer={
        alert.status === 'pending' ? (
          <>
            <button onClick={onClose} className="btn btn-default">
              关闭
            </button>
            <button onClick={() => onProcess?.(alert)} className="btn btn-primary">
              <CheckCircle className="w-4 h-4" />
              立即处理
            </button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div
            className={classNames(
              'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
              isUrgent ? 'bg-danger-100' : 'bg-warning-100'
            )}
          >
            {isUrgent ? (
              <Siren className="w-7 h-7 text-danger-600" />
            ) : (
              <AlertTriangle className="w-7 h-7 text-warning-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-sm font-medium text-primary-600">
                {alert.warningNo || alert.id}
              </span>
              <StatusBadge variant={levelConfig.color as any}>{levelConfig.label}</StatusBadge>
              <StatusBadge variant="neutral">{ALERT_TYPE[alert.type].label}</StatusBadge>
              <StatusBadge variant={ALERT_STATUS[alert.status].color as any}>
                {ALERT_STATUS[alert.status].label}
              </StatusBadge>
            </div>
            <p className="text-base font-medium text-neutral-800">{alert.description}</p>
            <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5" />
              {formatDateTime(alert.timestamp)}
            </p>
          </div>
        </div>

        {isUrgent && alert.status === 'pending' && (
          <div className="flex items-center gap-2 p-3 bg-danger-50 text-danger-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            该预警级别较高且尚未处理，请尽快核实并采取处置措施
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-neutral-800 flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-primary-500 rounded-full" />
              预警信息
            </h3>
            <div>
              {infoRow('预警类型', ALERT_TYPE[alert.type].label)}
              {infoRow('预警级别', levelConfig.label)}
              {infoRow(
                '预警来源',
                ALERT_SOURCE[alert.source]?.label || '-'
              )}
              {alert.type === 'speeding' &&
                infoRow(
                  '车速情况',
                  <span className="text-danger-600">
                    {alert.speed} km/h
                    {alert.speedLimit ? `（限速 ${alert.speedLimit} km/h）` : ''}
                  </span>
                )}
              {alert.type === 'fatigue' &&
                infoRow(
                  '连续驾驶',
                  <span className="text-warning-600">{alert.drivingHours} 小时</span>
                )}
              {alert.type === 'overload' &&
                infoRow(
                  '载重情况',
                  <span className="text-warning-600">
                    {alert.weight} 吨 / 核定 {alert.maxWeight} 吨
                  </span>
                )}
              {alert.duration && infoRow('持续时长', alert.duration)}
              {infoRow(
                '发生位置',
                <span className="flex items-center gap-1 justify-end">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  {alert.location?.address || '-'}
                </span>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-800 flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-warning-500 rounded-full" />
              关联信息
            </h3>
            <div>
              {infoRow(
                '车牌号',
                <span className="flex items-center gap-1 text-primary-600">
                  <Truck className="w-3.5 h-3.5" />
                  {alert.vehiclePlate || alert.vehicleId}
                </span>
              )}
              {infoRow(
                '驾驶员',
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  {alert.driverName || alert.driverId}
                </span>
              )}
              {alert.location &&
                infoRow(
                  '定位坐标',
                  <span className="font-mono text-xs">
                    {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                  </span>
                )}
              {infoRow('所属车队', '第一车队')}
              {infoRow(
                '数据来源',
                <span className="flex items-center gap-1">
                  <Satellite className="w-3.5 h-3.5 text-neutral-400" />
                  {ALERT_SOURCE[alert.source]?.label || '系统检测'}
                </span>
              )}
            </div>
          </div>
        </div>

        {alert.type === 'speeding' && alert.speed && alert.speedLimit && (
          <div className="p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-neutral-600 flex items-center gap-1">
                <Gauge className="w-4 h-4 text-danger-500" />
                超速程度
              </span>
              <span className="font-semibold text-danger-600">
                超出限速 {alert.speed - alert.speedLimit} km/h（
                {Math.round(((alert.speed - alert.speedLimit) / alert.speedLimit) * 100)}%）
              </span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-warning-500 to-danger-500 rounded-full"
                style={{
                  width: `${Math.min(100, Math.round((alert.speed / (alert.speedLimit * 1.5)) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}

        {alert.type === 'overload' && alert.weight && alert.maxWeight && (
          <div className="p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-neutral-600 flex items-center gap-1">
                <Weight className="w-4 h-4 text-warning-500" />
                超载程度
              </span>
              <span className="font-semibold text-warning-600">
                超载 {alert.weight - alert.maxWeight} 吨（
                {Math.round(((alert.weight - alert.maxWeight) / alert.maxWeight) * 100)}%）
              </span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-warning-500 to-danger-500 rounded-full"
                style={{ width: `${Math.min(100, Math.round((alert.weight / alert.maxWeight) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {alert.type === 'fatigue' && alert.drivingHours && (
          <div className="p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-neutral-600 flex items-center gap-1">
                <Clock className="w-4 h-4 text-warning-500" />
                连续驾驶时长
              </span>
              <span className="font-semibold text-warning-600">
                {alert.drivingHours} 小时（法定上限 4 小时）
              </span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={classNames(
                  'h-full rounded-full',
                  alert.drivingHours >= 4 ? 'bg-danger-500' : 'bg-warning-500'
                )}
                style={{ width: `${Math.min(100, (alert.drivingHours / 5) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {alert.status !== 'pending' && (
          <div>
            <h3 className="font-semibold text-neutral-800 flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-success-500 rounded-full" />
              处理记录
            </h3>
            <div className="card p-4 bg-neutral-50 border-neutral-200">
              <div className="flex items-center gap-3 mb-3">
                {alert.status === 'processed' ? (
                  <CheckCircle className="w-5 h-5 text-success-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-neutral-500" />
                )}
                <span className="font-medium text-neutral-800">
                  {alert.status === 'processed' ? '已处理' : '已忽略'}
                </span>
                {alert.handleResult && (
                  <StatusBadge
                    variant={ALERT_HANDLE_RESULT[alert.handleResult].color as any}
                  >
                    {ALERT_HANDLE_RESULT[alert.handleResult].label}
                  </StatusBadge>
                )}
                <span className="text-sm text-neutral-500 ml-auto flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" />
                  {alert.processedAt ? formatDateTime(alert.processedAt) : '-'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-neutral-600 flex items-start gap-2">
                  <User className="w-4 h-4 mt-0.5 text-neutral-400 flex-shrink-0" />
                  处理人：{alert.processedBy || '-'}
                </p>
                {alert.handleMeasure && (
                  <p className="text-neutral-600 flex items-start gap-2">
                    <ClipboardCheck className="w-4 h-4 mt-0.5 text-neutral-400 flex-shrink-0" />
                    处理措施：{alert.handleMeasure}
                  </p>
                )}
                {alert.remark && (
                  <p className="text-neutral-600 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 text-neutral-400 flex-shrink-0" />
                    备注：{alert.remark}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
