import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, FileText } from 'lucide-react';
import Modal from '@/components/UI/Modal';
import StatusBadge from '@/components/UI/StatusBadge';
import { FormField, FormInput, FormSelect } from '@/components/Form/FormField';
import { useVehicleStore } from '@/store/useVehicleStore';
import { toast } from '@/store/useToastStore';
import { DOCUMENT_STATUS, type Vehicle, type VehicleDocument } from '@/types';
import { formatDate, getDocumentStatus } from '@/utils';

interface DocumentManageModalProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

interface DocFormState {
  type: string;
  number: string;
  issueDate: string;
  expiryDate: string;
}

const emptyDocForm: DocFormState = {
  type: '',
  number: '',
  issueDate: '',
  expiryDate: '',
};

const DOCUMENT_TYPES = ['行驶证', '营运证', '道路运输证', '保险单', '年检合格证', '环保标志', '其他'];

type DocFormErrors = Partial<Record<keyof DocFormState, string>>;

export default function DocumentManageModal({ open, onClose, vehicle }: DocumentManageModalProps) {
  const { vehicles, addDocument, updateDocument, deleteDocument } = useVehicleStore();
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<VehicleDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<VehicleDocument | null>(null);
  const [form, setForm] = useState<DocFormState>(emptyDocForm);
  const [errors, setErrors] = useState<DocFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // 始终从 store 取最新车辆数据，保证增删改后列表实时刷新
  const currentVehicle = vehicles.find((v) => v.id === vehicle?.id) || vehicle;

  useEffect(() => {
    if (open) {
      setShowForm(false);
      setEditingDoc(null);
      setDeletingDoc(null);
      setForm(emptyDocForm);
      setErrors({});
    }
  }, [open]);

  if (!currentVehicle) return null;

  const set = (key: keyof DocFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const openAddForm = () => {
    setEditingDoc(null);
    setForm(emptyDocForm);
    setErrors({});
    setShowForm(true);
  };

  const openEditForm = (doc: VehicleDocument) => {
    setEditingDoc(doc);
    setForm({
      type: doc.type,
      number: doc.number,
      issueDate: doc.issueDate,
      expiryDate: doc.expiryDate,
    });
    setErrors({});
    setShowForm(true);
  };

  const validate = (): boolean => {
    const errs: DocFormErrors = {};
    if (!form.type) errs.type = '请选择证件类型';
    if (!form.number.trim()) errs.number = '请输入证件编号';
    if (!form.issueDate) errs.issueDate = '请选择签发日期';
    if (!form.expiryDate) {
      errs.expiryDate = '请选择到期日期';
    } else if (form.issueDate && form.expiryDate < form.issueDate) {
      errs.expiryDate = '到期日期不能早于签发日期';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.warning('请检查证件信息填写内容');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        type: form.type,
        number: form.number.trim(),
        issueDate: form.issueDate,
        expiryDate: form.expiryDate,
        status: getDocumentStatus(form.expiryDate),
      };
      if (editingDoc) {
        await updateDocument(currentVehicle.id, editingDoc.id, payload);
        toast.success(`证件「${payload.type}」已更新`);
      } else {
        await addDocument(currentVehicle.id, payload);
        toast.success(`证件「${payload.type}」已添加`);
      }
      setShowForm(false);
      setEditingDoc(null);
    } catch {
      toast.error('保存证件失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDoc) return;
    setSubmitting(true);
    try {
      await deleteDocument(currentVehicle.id, deletingDoc.id);
      toast.success(`证件「${deletingDoc.type}」已删除`);
      setDeletingDoc(null);
    } catch {
      toast.error('删除证件失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`证件管理 - ${currentVehicle.plateNumber}`} size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            共 {currentVehicle.documents.length} 个证件，证件状态根据到期日期自动计算
          </p>
          {!showForm && (
            <button onClick={openAddForm} className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs px-3 py-1.5">
              <Plus className="w-3.5 h-3.5" />
              添加证件
            </button>
          )}
        </div>

        {showForm && (
          <div className="card p-4 bg-neutral-50 border border-neutral-200">
            <h4 className="text-sm font-semibold text-neutral-800 mb-3">
              {editingDoc ? '编辑证件' : '添加证件'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="证件类型" required error={errors.type}>
                <FormSelect
                  value={form.type}
                  onChange={set('type')}
                  options={DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))}
                  placeholder="请选择证件类型"
                  error={!!errors.type}
                />
              </FormField>
              <FormField label="证件编号" required error={errors.number}>
                <FormInput
                  value={form.number}
                  onChange={set('number')}
                  placeholder="请输入证件编号"
                  error={!!errors.number}
                />
              </FormField>
              <FormField label="签发日期" required error={errors.issueDate}>
                <FormInput
                  type="date"
                  value={form.issueDate}
                  onChange={set('issueDate')}
                  error={!!errors.issueDate}
                />
              </FormField>
              <FormField label="到期日期" required error={errors.expiryDate}>
                <FormInput
                  type="date"
                  value={form.expiryDate}
                  onChange={set('expiryDate')}
                  error={!!errors.expiryDate}
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
                {submitting ? '提交中...' : editingDoc ? '保存修改' : '确认添加'}
              </button>
            </div>
          </div>
        )}

        {currentVehicle.documents.length === 0 ? (
          <div className="text-center py-10 text-neutral-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无证件信息，请点击右上角「添加证件」</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2 text-neutral-600 font-medium">证件类型</th>
                  <th className="text-left py-2 text-neutral-600 font-medium">证件编号</th>
                  <th className="text-left py-2 text-neutral-600 font-medium">签发日期</th>
                  <th className="text-left py-2 text-neutral-600 font-medium">到期日期</th>
                  <th className="text-left py-2 text-neutral-600 font-medium">状态</th>
                  <th className="text-right py-2 text-neutral-600 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {currentVehicle.documents.map((doc) => {
                  const status = DOCUMENT_STATUS[getDocumentStatus(doc.expiryDate)];
                  return (
                    <tr key={doc.id} className="border-b border-neutral-100">
                      <td className="py-3 font-medium text-neutral-800">{doc.type}</td>
                      <td className="py-3 text-neutral-600">{doc.number}</td>
                      <td className="py-3 text-neutral-600">{formatDate(doc.issueDate)}</td>
                      <td className="py-3 text-neutral-600">{formatDate(doc.expiryDate)}</td>
                      <td className="py-3">
                        <StatusBadge variant={status.color as any}>{status.label}</StatusBadge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditForm(doc)}
                            className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingDoc(doc)}
                            className="p-1.5 text-danger-600 hover:bg-danger-50 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deletingDoc && (
        <Modal
          open={!!deletingDoc}
          onClose={() => setDeletingDoc(null)}
          title="确认删除"
          size="sm"
          footer={
            <>
              <button onClick={() => setDeletingDoc(null)} className="btn btn-default" disabled={submitting}>
                取消
              </button>
              <button onClick={handleDelete} className="btn btn-danger" disabled={submitting}>
                {submitting ? '删除中...' : '确认删除'}
              </button>
            </>
          }
        >
          <p className="text-center py-4 text-neutral-800">
            确定要删除证件「{deletingDoc.type}」（{deletingDoc.number}）吗？
          </p>
        </Modal>
      )}
    </Modal>
  );
}
