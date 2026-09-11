import { useEffect } from 'react';
import { Radio, Pause, Play, Truck, Gauge, AlertTriangle, MousePointerClick, Activity } from 'lucide-react';
import { useTrackingStore } from '@/store/useTrackingStore';
import { useSafetyStore } from '@/store/useSafetyStore';
import TrackingMap from './TrackingMap';
import VehicleList from './VehicleList';
import VehicleDetail from './VehicleDetail';
import { formatDateTime, classNames } from '@/utils';

export default function TrackingPage() {
  const { vehicles, isLive, lastUpdate, startLive, stopLive, selectedVehicleId } = useTrackingStore();
  const { alerts } = useSafetyStore();

  // 进入页面启动实时定位模拟，离开时停止
  useEffect(() => {
    startLive();
    return () => stopLive();
  }, [startLive, stopLive]);

  const activeVehicles = vehicles.filter((v) => v.status === 'active');
  const movingVehicles = activeVehicles.filter((v) => v.position.speed > 0);
  const avgSpeed =
    movingVehicles.length > 0
      ? Math.round(movingVehicles.reduce((sum, v) => sum + v.position.speed, 0) / movingVehicles.length)
      : 0;
  const pendingAlerts = alerts.filter((a) => a.status === 'pending').length;

  const stats = [
    {
      label: '在线车辆',
      value: `${activeVehicles.length}/${vehicles.length}`,
      icon: Truck,
      iconClass: 'bg-primary-100 text-primary-600',
    },
    {
      label: '行驶中',
      value: movingVehicles.length,
      icon: Activity,
      iconClass: 'bg-success-100 text-success-600',
    },
    {
      label: '平均速度',
      value: `${avgSpeed} km/h`,
      icon: Gauge,
      iconClass: 'bg-warning-100 text-warning-600',
    },
    {
      label: '待处理预警',
      value: pendingAlerts,
      icon: AlertTriangle,
      iconClass: 'bg-danger-100 text-danger-600',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">实时跟踪</h1>
          <p className="text-sm text-neutral-500 mt-1">实时监控车辆位置，查看行驶轨迹与历史回放</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={classNames(
                'w-2 h-2 rounded-full',
                isLive ? 'bg-success-500 animate-pulse' : 'bg-neutral-400'
              )}
            />
            <span className={isLive ? 'text-success-600' : 'text-neutral-500'}>
              {isLive ? '实时更新中' : '已暂停'}
            </span>
            <span className="text-neutral-400 text-xs">更新于 {formatDateTime(lastUpdate).slice(11)}</span>
          </div>
          <button
            onClick={isLive ? stopLive : startLive}
            className={classNames('btn', isLive ? 'btn-default' : 'btn-primary')}
          >
            {isLive ? (
              <>
                <Pause className="w-4 h-4" />
                暂停刷新
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                恢复刷新
              </>
            )}
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={classNames('w-11 h-11 rounded-xl flex items-center justify-center', s.iconClass)}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-800">{s.value}</div>
              <div className="text-xs text-neutral-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 地图与车辆列表 */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 h-[calc(100vh-21rem)] min-h-[500px]">
        <div className="xl:col-span-1 h-full min-h-[240px]">
          <VehicleList />
        </div>
        <div className="xl:col-span-3 relative card overflow-hidden">
          <TrackingMap />
          <VehicleDetail />
          {!selectedVehicleId && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/95 rounded-full shadow-card px-4 py-2 flex items-center gap-2 text-xs text-neutral-500 pointer-events-none">
              <MousePointerClick className="w-3.5 h-3.5 text-primary-500" />
              点击地图车辆标记或左侧列表，查看车辆详情与行驶轨迹
            </div>
          )}
          <div className="absolute bottom-3 right-3 bg-white/90 rounded shadow-card px-2.5 py-1.5 flex items-center gap-1.5 text-xs text-neutral-500 pointer-events-none">
            <Radio className="w-3.5 h-3.5 text-success-500" />
            GPS 定位模拟 · 每 2 秒上报
          </div>
        </div>
      </div>
    </div>
  );
}
