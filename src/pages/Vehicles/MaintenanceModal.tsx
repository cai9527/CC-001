import { useEffect, useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
import Modal from '@/components/UI/Modal';
import { FormField, FormInput, FormSelect, FormTextArea } from '@/components/Form/FormField';
import { useVehicleStore } from '@/store/useVehicleStore';
import { toast } from '@/store/useToastStore';
import { MAINTENANCE_TYPES, type Vehicle } from '@/types';
import { formatDate, formatCurrency } from '@/utils';

interface MaintenanceModalProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

interface RecordFormState {
  date: string;
  type: string;
  description: string;
  cost: string;
  mileage: string;
  operator: string;
  organization: string;
}

const emptyRecordForm: RecordFormState = {
  date: new Date().toISOString().split('T')[0],
  type: '',
  description: '',
  cost: '',
  mileage: '',
  operator: '',
  organization: '',
};

type RecordFormErrors = Partial<Record<keyof RecordFormState, string>>;

export default function MaintenanceModal({ open, onClose, vehicle }: MaintenanceModalProps) {
  const { vehicles, addMaintenance } = useVehicleStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RecordFormState>(emptyRecordForm);
  const [errors, setErrors] = useState<RecordFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const currentVehicle = vehicles.find((v) => v.id === vehicle?.id) || vehicle;

  useEffect(() => {
    if (open) {
      setShowForm(false);
      setForm({ ...emptyRecordForm, mileage: currentVehicle ? String(currentVehicle.mileage) : '' });
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!currentVehicle) return null;

  const set = (key: keyof RecordFormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: RecordFormErrors = {};
    if (!form.date) errs.date = '请选择维护日期';
    if (!form.type) errs.type = '请选择维护类型';
    if (!form.description.trim()) errs.description = '请输入维护内容';
    const cost = Number(form.cost);
    if (!form.cost.trim()) {
      errs.cost = '请输入维护费用';
    } else if (isNaN(cost) || cost < 0) {
      errs.cost = '费用需为非负数字';
    }
    const mileage = Number(form.mileage);
    if (!form.mileage.trim()) {
      errs.mileage = '请输入维护时里程';
    } else if (isNaN(mileage) || mileage < 0) {
      errs.mileage = '里程需为非负数字';
    }
    if (!form.operator.trim()) errs.operator = '请输入经办人';
    if (!form.organization.trim()) errs.organization = '请输入维护机构';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.warning('请检查维护记录填写内容');
      return;
    }
    setSubmitting(true);
    try {
      await addMaintenance(currentVehicle.id, {
        date: form.date,
        type: form.type,
        description: form.description.trim(),
        cost: Number(form.cost),
        mileage: Number(form.mileage),
        operator: form.operator.trim(),
        organization: form.organization.trim(),
      });
      toast.success('维护记录已添加');
      setShowForm(false);
      setForm(emptyRecordForm);
    } catch {
      toast.error('添加维护记录失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const records = [...currentVehicle.maintenanceRecords].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Modal open={open} onClose={onClose} title={`维护记录 - ${currentVehicle.plateNumber}`} size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            共 {records.length} 条维护记录，累计费用{' '}
            {formatCurrency(records.reduce((sum, r) => sum + r.cost, 0))}
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              新增记录
            </button>
          )}
        </div>

        {showForm && (
          <div className="card p-4 bg-neutral-50 border border-neutral-200">
            <h4 className="text-sm font-semibold text-neutral-800 mb-3">新增维护记录</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="维护日期" required error={errors.date}>
                <FormInput type="date" value={form.date} onChange={set('date')} error={!!errors.date} />
              </FormField>
              <FormField label="维护类型" required error={errors.type}>
                <FormSelect
                  value={form.type}
                  onChange={set('type')}
                  options={MAINTENANCE_TYPES.map((t) => ({ value: t, label: t }))}
                  placeholder="请选择维护类型"
                  error={!!errors.type}
                />
              </FormField>
              <FormField label="维护费用（元）" required error={errors.cost}>
                <FormInput
                  type="number"
                  min={0}
                  value={form.cost}
                  onChange={set('cost')}
                  placeholder="如：1200"
                  error={!!errors.cost}
                />
              </FormField>
              <FormField label="维护时里程（公里）" required error={errors.mileage}>
                <FormInput
                  type="number"
                  min={0}
                  value={form.mileage}
                  onChange={set('mileage')}
                  error={!!errors.mileage}
                />
              </FormField>
              <FormField label="经办人" required error={errors.operator}>
                <FormInput
                  value={form.operator}
                  onChange={set('operator')}
                  placeholder="如：张师傅"
                  error={!!errors.operator}
                />
              </FormField>
              <FormField label="维护机构" required error={errors.organization}>
                <FormInput
                  value={form.organization}
                  onChange={set('organization')}
                  placeholder="如：重汽4S店"
                  error={!!errors.organization}
                />
              </FormField>
              <FormField label="维护内容" required error={errors.description} className="md:col-span-3">
                <FormTextArea
                  rows={2}
                  value={form.description}
                  onChange={set('description')}
                  placeholder="请描述维护项目、更换配件等"
                  error={!!errors.description}
                />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowForm(false)}
                className="btn btn-default px-3 py-1.5 text-xs"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-primary px-3 py-1.5 text-xs"
                disabled={submitting}
              >
                {submitting ? '提交中...' : '确认添加'}
              </button>
            </div>
          </div>
        )}

        {records.length === 0 ? (
          <div className="text-center py-10 text-neutral-400">
            <Wrench className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无维护记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2 text-neutral-600 font-medium">维护日期</th>
                  <th className="text-left py-2 text-neutral-600 font-medium">类型</th>
                  <th className="text-left py-2 text-neutral-600 font-medium">维护内容</th>
                  <th className="text-left py-2 text-neutral-600 font-medium">维护机构</th>
                  <th className="text-left py-2 text-neutral-600 font-medium">经办人</th>
                  <th className="text-right py-2 text-neutral-600 font-medium">里程</th>
                  <th className="text-right py-2 text-neutral-600 font-medium">费用</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-neutral-100">
                    <td className="py-3 text-neutral-600">{formatDate(record.date)}</td>
                    <td className="py-3 font-medium text-neutral-800">{record.type}</td>
                    <td className="py-3 text-neutral-600 max-w-48 truncate" title={record.description}>
                      {record.description}
                    </td>
                    <td className="py-3 text-neutral-600">{record.organization}</td>
                    <td className="py-3 text-neutral-600">{record.operator}</td>
                    <td className="py-3 text-right text-neutral-600">
                      {record.mileage.toLocaleString()} km
                    </td>
                    <td className="py-3 text-right font-medium text-neutral-800">
                      {formatCurrency(record.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
