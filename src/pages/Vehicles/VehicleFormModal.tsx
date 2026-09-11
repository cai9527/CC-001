import { useEffect, useState } from 'react';
import Modal from '@/components/UI/Modal';
import { FormField, FormInput, FormSelect } from '@/components/Form/FormField';
import { useVehicleStore } from '@/store/useVehicleStore';
import { useDriverStore } from '@/store/useDriverStore';
import { toast } from '@/store/useToastStore';
import { VEHICLE_TYPES, VEHICLE_STATUS, type Vehicle } from '@/types';
import { validatePlateNumber } from '@/utils';

interface VehicleFormModalProps {
  open: boolean;
  onClose: () => void;
  /** 传入车辆为编辑模式，否则为新增模式 */
  vehicle?: Vehicle | null;
}

interface FormState {
  plateNumber: string;
  vehicleType: string;
  loadCapacity: string;
  manufacturer: string;
  model: string;
  year: string;
  mileage: string;
  status: Vehicle['status'];
  vin: string;
  engineNumber: string;
  purchaseDate: string;
  insuranceExpiry: string;
  operationLicenseExpiry: string;
  inspectionExpiry: string;
  environmentalExpiry: string;
  driverId: string;
  gpsLat: string;
  gpsLng: string;
  gpsAddress: string;
}

const emptyForm: FormState = {
  plateNumber: '',
  vehicleType: '',
  loadCapacity: '',
  manufacturer: '',
  model: '',
  year: String(new Date().getFullYear()),
  mileage: '0',
  status: 'inactive',
  vin: '',
  engineNumber: '',
  purchaseDate: '',
  insuranceExpiry: '',
  operationLicenseExpiry: '',
  inspectionExpiry: '',
  environmentalExpiry: '',
  driverId: '',
  gpsLat: '',
  gpsLng: '',
  gpsAddress: '',
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function VehicleFormModal({ open, onClose, vehicle }: VehicleFormModalProps) {
  const { vehicles, addVehicle, updateVehicle } = useVehicleStore();
  const { drivers } = useDriverStore();
  const isEdit = !!vehicle;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (vehicle) {
      setForm({
        plateNumber: vehicle.plateNumber,
        vehicleType: vehicle.vehicleType,
        loadCapacity: String(vehicle.loadCapacity),
        manufacturer: vehicle.manufacturer,
        model: vehicle.model,
        year: String(vehicle.year),
        mileage: String(vehicle.mileage),
        status: vehicle.status,
        vin: vehicle.vin,
        engineNumber: vehicle.engineNumber,
        purchaseDate: vehicle.purchaseDate,
        insuranceExpiry: vehicle.insuranceExpiry,
        operationLicenseExpiry: vehicle.operationLicenseExpiry,
        inspectionExpiry: vehicle.inspectionExpiry,
        environmentalExpiry: vehicle.environmentalExpiry,
        driverId: vehicle.driverId || '',
        gpsLat: vehicle.currentLocation ? String(vehicle.currentLocation.lat) : '',
        gpsLng: vehicle.currentLocation ? String(vehicle.currentLocation.lng) : '',
        gpsAddress: vehicle.currentLocation?.address || '',
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [open, vehicle]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!form.plateNumber.trim()) {
      errs.plateNumber = '请输入车牌号';
    } else if (!validatePlateNumber(form.plateNumber.trim())) {
      errs.plateNumber = '车牌号格式不正确，如：京A12345';
    } else if (
      vehicles.some(
        (v) => v.plateNumber === form.plateNumber.trim() && v.id !== vehicle?.id
      )
    ) {
      errs.plateNumber = '该车牌号已存在，请勿重复录入';
    }

    if (!form.vehicleType) errs.vehicleType = '请选择车辆类型';

    const load = Number(form.loadCapacity);
    if (!form.loadCapacity.trim()) {
      errs.loadCapacity = '请输入核定载重';
    } else if (isNaN(load) || load <= 0 || load > 100) {
      errs.loadCapacity = '载重需为 0-100 之间的数字（吨）';
    }

    if (!form.manufacturer.trim()) errs.manufacturer = '请输入生产厂商';
    if (!form.model.trim()) errs.model = '请输入车辆型号';

    const year = Number(form.year);
    const currentYear = new Date().getFullYear();
    if (!form.year.trim()) {
      errs.year = '请输入出厂年份';
    } else if (isNaN(year) || year < 1990 || year > currentYear) {
      errs.year = `出厂年份需在 1990-${currentYear} 之间`;
    }

    const mileage = Number(form.mileage);
    if (form.mileage.trim() && (isNaN(mileage) || mileage < 0)) {
      errs.mileage = '行驶里程需为非负数字';
    }

    if (form.vin.trim() && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(form.vin.trim())) {
      errs.vin = '车架号（VIN）应为 17 位字母数字组合';
    }

    if (!form.purchaseDate) errs.purchaseDate = '请选择购买日期';
    if (!form.insuranceExpiry) errs.insuranceExpiry = '请选择保险到期日期';
    if (!form.operationLicenseExpiry) errs.operationLicenseExpiry = '请选择营运证到期日期';
    if (!form.inspectionExpiry) errs.inspectionExpiry = '请选择年检到期日期';

    const lat = form.gpsLat.trim();
    const lng = form.gpsLng.trim();
    if (lat || lng) {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (!lat || isNaN(latNum) || latNum < -90 || latNum > 90) {
        errs.gpsLat = '纬度需为 -90 到 90 之间的数字';
      }
      if (!lng || isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        errs.gpsLng = '经度需为 -180 到 180 之间的数字';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.warning('请检查表单填写内容');
      return;
    }
    setSubmitting(true);
    try {
      const driver = drivers.find((d) => d.id === form.driverId);
      const payload = {
        plateNumber: form.plateNumber.trim(),
        vehicleType: form.vehicleType,
        loadCapacity: Number(form.loadCapacity),
        manufacturer: form.manufacturer.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        mileage: Number(form.mileage) || 0,
        status: form.status,
        vin: form.vin.trim().toUpperCase(),
        engineNumber: form.engineNumber.trim(),
        purchaseDate: form.purchaseDate,
        insuranceExpiry: form.insuranceExpiry,
        operationLicenseExpiry: form.operationLicenseExpiry,
        inspectionExpiry: form.inspectionExpiry,
        environmentalExpiry: form.environmentalExpiry,
        driverId: form.driverId || undefined,
        driverName: driver?.name,
        currentLocation:
          form.gpsLat.trim() && form.gpsLng.trim()
            ? {
                lat: Number(form.gpsLat.trim()),
                lng: Number(form.gpsLng.trim()),
                address: form.gpsAddress.trim() || undefined,
              }
            : undefined,
      };
      if (isEdit) {
        await updateVehicle(vehicle.id, payload);
        toast.success(`车辆 ${payload.plateNumber} 信息已更新`);
      } else {
        await addVehicle(payload);
        toast.success(`车辆 ${payload.plateNumber} 新增成功`);
      }
      onClose();
    } catch {
      toast.error(isEdit ? '更新车辆失败，请重试' : '新增车辆失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 已绑定其他车辆的驾驶员不可再选择（编辑时保留当前车辆已绑定的驾驶员）
  const boundDriverIds = new Set(
    vehicles
      .filter((v) => v.id !== vehicle?.id && v.driverId)
      .map((v) => v.driverId as string)
  );
  const driverOptions = drivers
    .filter((d) => !boundDriverIds.has(d.id))
    .map((d) => ({ value: d.id, label: `${d.name}（${d.phone}）` }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `编辑车辆 - ${vehicle.plateNumber}` : '新增车辆'}
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="btn btn-default" disabled={submitting}>
            取消
          </button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={submitting}>
            {submitting ? '提交中...' : isEdit ? '保存修改' : '确认新增'}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-primary-500 rounded-full" />
            基本信息
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="车牌号" required error={errors.plateNumber}>
              <FormInput
                value={form.plateNumber}
                onChange={set('plateNumber')}
                placeholder="如：京A12345"
                error={!!errors.plateNumber}
                maxLength={8}
              />
            </FormField>
            <FormField label="车辆类型" required error={errors.vehicleType}>
              <FormSelect
                value={form.vehicleType}
                onChange={set('vehicleType')}
                options={VEHICLE_TYPES}
                placeholder="请选择车辆类型"
                error={!!errors.vehicleType}
              />
            </FormField>
            <FormField label="核定载重（吨）" required error={errors.loadCapacity}>
              <FormInput
                type="number"
                min={0}
                value={form.loadCapacity}
                onChange={set('loadCapacity')}
                placeholder="如：25"
                error={!!errors.loadCapacity}
              />
            </FormField>
            <FormField label="生产厂商" required error={errors.manufacturer}>
              <FormInput
                value={form.manufacturer}
                onChange={set('manufacturer')}
                placeholder="如：中国重汽"
                error={!!errors.manufacturer}
              />
            </FormField>
            <FormField label="车辆型号" required error={errors.model}>
              <FormInput
                value={form.model}
                onChange={set('model')}
                placeholder="如：豪沃ZZ3257N4147E1"
                error={!!errors.model}
              />
            </FormField>
            <FormField label="出厂年份" required error={errors.year}>
              <FormInput
                type="number"
                min={1990}
                value={form.year}
                onChange={set('year')}
                error={!!errors.year}
              />
            </FormField>
            <FormField label="累计里程（公里）" error={errors.mileage}>
              <FormInput
                type="number"
                min={0}
                value={form.mileage}
                onChange={set('mileage')}
                error={!!errors.mileage}
              />
            </FormField>
            <FormField label="车辆状态" required>
              <FormSelect
                value={form.status}
                onChange={set('status')}
                options={Object.entries(VEHICLE_STATUS).map(([value, v]) => ({
                  value,
                  label: v.label,
                }))}
              />
            </FormField>
            <FormField label="绑定驾驶员">
              <FormSelect
                value={form.driverId}
                onChange={set('driverId')}
                options={driverOptions}
                placeholder="暂不绑定"
              />
            </FormField>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-warning-500 rounded-full" />
            标识信息
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="车架号（VIN）" error={errors.vin} className="md:col-span-2">
              <FormInput
                value={form.vin}
                onChange={set('vin')}
                placeholder="17 位车架号"
                error={!!errors.vin}
                maxLength={17}
              />
            </FormField>
            <FormField label="发动机号">
              <FormInput
                value={form.engineNumber}
                onChange={set('engineNumber')}
                placeholder="发动机编号"
              />
            </FormField>
            <FormField label="购买日期" required error={errors.purchaseDate}>
              <FormInput
                type="date"
                value={form.purchaseDate}
                onChange={set('purchaseDate')}
                error={!!errors.purchaseDate}
              />
            </FormField>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-success-500 rounded-full" />
            证件有效期
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="保险到期日期" required error={errors.insuranceExpiry}>
              <FormInput
                type="date"
                value={form.insuranceExpiry}
                onChange={set('insuranceExpiry')}
                error={!!errors.insuranceExpiry}
              />
            </FormField>
            <FormField label="营运证到期日期" required error={errors.operationLicenseExpiry}>
              <FormInput
                type="date"
                value={form.operationLicenseExpiry}
                onChange={set('operationLicenseExpiry')}
                error={!!errors.operationLicenseExpiry}
              />
            </FormField>
            <FormField label="年检到期日期" required error={errors.inspectionExpiry}>
              <FormInput
                type="date"
                value={form.inspectionExpiry}
                onChange={set('inspectionExpiry')}
                error={!!errors.inspectionExpiry}
              />
            </FormField>
            <FormField label="环保标志到期日期">
              <FormInput
                type="date"
                value={form.environmentalExpiry}
                onChange={set('environmentalExpiry')}
              />
            </FormField>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-primary-500 rounded-full" />
            GPS 位置
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="纬度" error={errors.gpsLat} hint="范围 -90 ~ 90，如 39.9042">
              <FormInput
                value={form.gpsLat}
                onChange={set('gpsLat')}
                placeholder="如：39.9042"
                error={!!errors.gpsLat}
              />
            </FormField>
            <FormField label="经度" error={errors.gpsLng} hint="范围 -180 ~ 180，如 116.4074">
              <FormInput
                value={form.gpsLng}
                onChange={set('gpsLng')}
                placeholder="如：116.4074"
                error={!!errors.gpsLng}
              />
            </FormField>
            <FormField label="所在位置">
              <FormInput
                value={form.gpsAddress}
                onChange={set('gpsAddress')}
                placeholder="如：北京市朝阳区"
                maxLength={50}
              />
            </FormField>
          </div>
        </div>
      </div>
    </Modal>
  );
}
