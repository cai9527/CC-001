import { useMemo, useState } from 'react';
import { Search, Gauge } from 'lucide-react';
import { useTrackingStore } from '@/store/useTrackingStore';
import { VEHICLE_STATUS } from '@/types';
import type { Vehicle } from '@/types';
import { classNames } from '@/utils';

const STATUS_FILTERS: { value: '' | Vehicle['status']; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'active', label: '运行中' },
  { value: 'maintenance', label: '维护中' },
  { value: 'inactive', label: '闲置' },
  { value: 'repair', label: '维修中' },
];

export default function VehicleList() {
  const { vehicles, selectedVehicleId, selectVehicle } = useTrackingStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | Vehicle['status']>('');

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        !search ||
        v.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
        (v.driverName ?? '').includes(search);
      const matchStatus = !statusFilter || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vehicles, search, statusFilter]);

  const countOf = (status: '' | Vehicle['status']) =>
    status === '' ? vehicles.length : vehicles.filter((v) => v.status === status).length;

  return (
    <div className="card flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-neutral-100 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索车牌号 / 驾驶员"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setStatusFilter(f.value)}
              className={classNames(
                'px-2 py-1 rounded text-xs transition-colors',
                statusFilter === f.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              {f.label} {countOf(f.value)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-neutral-400">无匹配车辆</div>
        )}
        {filtered.map((v) => {
          const statusConf = VEHICLE_STATUS[v.status];
          const isSelected = v.vehicleId === selectedVehicleId;
          return (
            <button
              key={v.vehicleId}
              onClick={() => selectVehicle(isSelected ? null : v.vehicleId)}
              className={classNames(
                'w-full text-left p-3 rounded-lg border transition-all',
                isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-sm'
                  : 'border-transparent hover:bg-neutral-50'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={classNames('w-2 h-2 rounded-full', v.status === 'active' && 'animate-pulse')}
                    style={{ backgroundColor: statusConf.color }}
                  />
                  <span className="font-medium text-neutral-800">{v.plateNumber}</span>
                </div>
                <span className={`badge ${statusConf.class}`}>{statusConf.label}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-neutral-500">
                <span>驾驶员：{v.driverName ?? '未分配'}</span>
                {v.status === 'active' && (
                  <span className="inline-flex items-center gap-1 font-medium text-primary-600">
                    <Gauge className="w-3.5 h-3.5" />
                    {v.position.speed} km/h
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
