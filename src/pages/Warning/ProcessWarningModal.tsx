import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ShieldAlert, User } from 'lucide-react';
import Modal from '@/components/UI/Modal';
import StatusBadge from '@/components/UI/StatusBadge';
import { useSafetyStore } from '@/store/useSafetyStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { ALERT_LEVEL, ALERT_TYPE, ALERT_HANDLE_RESULT } from '@/types';
import { classNames } from '@/utils';
import type { SafetyAlert } from '@/types';

interface ProcessData {
  status: 'processed' | 'ignored';
  handleResult?: SafetyAlert['handleResult'];
  handleMeasure?: string;
  remark?: string;
}

interface ProcessWarningModalProps {
  open: boolean;
  onClose: () => void;
  alert?: SafetyAlert | null;
  /** 批量处理模式 */
  batch?: boolean;
  count?: number;
  onSubmit?: (data: ProcessData) => void | Promise<void>;
}

const RESULT_OPTIONS: { value: SafetyAlert['handleResult']; desc: string }[] = [
  { value: 'verified', desc: '核实预警情况属实' },
  { value: 'educated', desc: '已对驾驶员教育提醒' },
  { value: 'penalized', desc: '已处罚并要求整改' },
  { value: 'false_alarm', desc: '设备误报，无需处置' },
];

const QUICK_MEASURES = [
  '电话提醒驾驶员立即纠正',
  '要求就近停车休息',
  '通知现场核查并卸货整改',
  '约谈驾驶员并安全教育',
  '上报车队按制度处罚',
  '远程检查并重启车载设备',
];

export default function ProcessWarningModal({
  open,
  onClose,
  alert,
  batch = false,
  count = 0,
  onSubmit,
}: ProcessWarningModalProps) {
  const { processAlert } = useSafetyStore();
  const { currentUser } = useAuthStore();
  const [handleResult, setHandleResult] = useState<SafetyAlert['handleResult']>('verified');
  const [handleMeasure, setHandleMeasure] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setHandleResult('verified');
      setHandleMeasure('');
      setRemark('');
      setSubmitting(false);
    }
  }, [open, alert?.id]);

  const handleConfirm = async (confirmAction: 'processed' | 'ignored') => {
    if (confirmAction === 'processed' && !handleMeasure.trim()) {
      toast.warning('请填写处理措施');
      return;
    }
    setSubmitting(true);
    try {
      if (batch) {
        await onSubmit?.({
          status: confirmAction,
          handleResult: confirmAction === 'processed' ? handleResult : undefined,
          handleMeasure: confirmAction === 'processed' ? handleMeasure.trim() : undefined,
          remark: remark.trim() || undefined,
        });
      } else if (alert) {
        await processAlert(
          alert.id,
          confirmAction,
          remark.trim() || undefined,
          {
            handleResult: confirmAction === 'processed' ? handleResult : undefined,
            handleMeasure: confirmAction === 'processed' ? handleMeasure.trim() : undefined,
          }
        );
        toast.success(
          confirmAction === 'processed'
            ? `预警 ${alert.warningNo || alert.id} 已处理`
            : `预警 ${alert.warningNo || alert.id} 已忽略`
        );
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={batch ? `批量处理预警（${count} 条）` : '处理预警'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn btn-default" disabled={submitting}>
            取消
          </button>
          <button
            onClick={() => handleConfirm('ignored')}
            className="btn btn-default"
            disabled={submitting}
          >
            <XCircle className="w-4 h-4" />
            标记忽略
          </button>
          <button
            onClick={() => handleConfirm('processed')}
            className="btn btn-primary"
            disabled={submitting}
          >
            <CheckCircle className="w-4 h-4" />
            {submitting ? '提交中...' : '确认处理'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {!batch && alert ? (
          <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg">
            <ShieldAlert
              className={classNames(
                'w-6 h-6 flex-shrink-0 mt-0.5',
                alert.level === 'critical' || alert.level === 'high'
                  ? 'text-danger-500'
                  : 'text-warning-500'
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-medium text-primary-600 text-sm">
                  {alert.warningNo || alert.id}
                </span>
                <StatusBadge variant={ALERT_LEVEL[alert.level].color as any}>
                  {ALERT_LEVEL[alert.level].label}
                </StatusBadge>
                <StatusBadge variant="neutral">{ALERT_TYPE[alert.type].label}</StatusBadge>
              </div>
              <p className="text-sm font-medium text-neutral-800">{alert.description}</p>
              <p className="text-sm text-neutral-500 mt-1">
                {alert.vehiclePlate} · {alert.driverName}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-primary-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-neutral-800">
                将对选中的 {count} 条待处理预警执行相同的处置操作
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                批量处理后所有预警将记录相同的处理结果与措施，请谨慎操作
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            处理结果 <span className="text-danger-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {RESULT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setHandleResult(opt.value)}
                className={classNames(
                  'flex items-center gap-2 px-4 py-3 rounded-lg border text-left transition-all',
                  handleResult === opt.value
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20'
                    : 'border-neutral-300 hover:border-neutral-400'
                )}
              >
                <span
                  className={classNames(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    handleResult === opt.value ? 'border-primary-500' : 'border-neutral-300'
                  )}
                >
                  {handleResult === opt.value && (
                    <span className="w-2 h-2 rounded-full bg-primary-500" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-medium text-neutral-800">
                    {ALERT_HANDLE_RESULT[opt.value].label}
                  </p>
                  <p className="text-xs text-neutral-500">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            处理措施 <span className="text-danger-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {QUICK_MEASURES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setHandleMeasure(m)}
                className="px-2.5 py-1 text-xs text-neutral-600 bg-neutral-100 hover:bg-primary-50 hover:text-primary-600 rounded-full transition-colors"
              >
                {m}
              </button>
            ))}
          </div>
          <textarea
            value={handleMeasure}
            onChange={(e) => setHandleMeasure(e.target.value)}
            placeholder="请描述具体处置措施，如：已电话通知驾驶员减速行驶，后续持续跟踪..."
            rows={3}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">备注</label>
          <input
            type="text"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="选填，补充说明信息"
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-neutral-500 pt-1">
          <User className="w-4 h-4" />
          处理人：{currentUser?.name || '系统管理员'}
          <span className="ml-auto">处理时间将自动记录</span>
        </div>
      </div>
    </Modal>
  );
}
