import { X, Play, Pause, Square, MapPin, Gauge, Compass, History, User, Navigation } from 'lucide-react';
import { useTrackingStore } from '@/store/useTrackingStore';
import { useTaskStore } from '@/store/useTaskStore';
import { VEHICLE_STATUS, TASK_STATUS } from '@/types';
import { formatDateTime, classNames } from '@/utils';

/** 航向角转中文方位 */
const headingText = (heading: number): string => {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  return dirs[Math.round(heading / 45) % 8];
};

const PLAYBACK_SPEEDS: (1 | 2 | 4)[] = [1, 2, 4];

export default function VehicleDetail() {
  const {
    vehicles,
    selectedVehicleId,
    selectVehicle,
    playback,
    startPlayback,
    stopPlayback,
    togglePlayback,
    setPlaybackIndex,
    setPlaybackSpeed,
  } = useTrackingStore();
  const { getTaskById } = useTaskStore();

  const vehicle = vehicles.find((v) => v.vehicleId === selectedVehicleId);
  if (!vehicle) return null;

  const statusConf = VEHICLE_STATUS[vehicle.status];
  const task = vehicle.taskId ? getTaskById(vehicle.taskId) : undefined;
  const maxIndex = Math.max(vehicle.trail.length - 1, 0);
  const currentPoint = playback.active ? vehicle.trail[Math.min(playback.index, maxIndex)] : vehicle.position;
  const canPlayback = vehicle.trail.length > 1;

  return (
    <div className="absolute top-3 left-3 w-80 card shadow-card-hover animate-slide-in-left flex flex-col max-h-[calc(100%-1.5rem)]">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-800">{vehicle.plateNumber}</span>
          <span className={`badge ${statusConf.class}`}>{statusConf.label}</span>
        </div>
        <button
          onClick={() => selectVehicle(null)}
          className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        {/* 实时数据 */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-neutral-50 rounded-lg p-2.5">
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <Gauge className="w-3.5 h-3.5" />
              实时速度
            </div>
            <div className="mt-1 text-lg font-bold text-neutral-800">
              {playback.active ? currentPoint.speed : vehicle.position.speed}
              <span className="text-xs font-normal text-neutral-500 ml-1">km/h</span>
            </div>
          </div>
          <div className="bg-neutral-50 rounded-lg p-2.5">
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <Compass className="w-3.5 h-3.5" />
              航向
            </div>
            <div className="mt-1 text-lg font-bold text-neutral-800">
              {headingText(currentPoint.heading)}
              <span className="text-xs font-normal text-neutral-500 ml-1">
                {Math.round(currentPoint.heading)}°
              </span>
            </div>
          </div>
        </div>

        {/* 位置信息 */}
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-neutral-700 font-mono text-xs">
                {currentPoint.lat.toFixed(5)}, {currentPoint.lng.toFixed(5)}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">
                更新于 {formatDateTime(currentPoint.timestamp).slice(11)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-400" />
            <span className="text-neutral-700">{vehicle.driverName ?? '未分配驾驶员'}</span>
          </div>
        </div>

        {/* 当前任务 */}
        {task && (
          <div className="border border-neutral-100 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">当前任务</span>
              <span className={`badge ${TASK_STATUS[task.status].class}`}>
                {TASK_STATUS[task.status].label}
              </span>
            </div>
            <div className="text-sm font-medium text-neutral-800 line-clamp-2">{task.name}</div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Navigation className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {task.fromLocation} → {task.toLocation}
              </span>
            </div>
            <div>
              <div className="flex justify-between text-xs text-neutral-500 mb-1">
                <span>运输进度</span>
                <span>
                  {task.completedLoads}/{task.plannedLoads} 趟
                </span>
              </div>
              <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${task.plannedLoads ? (task.completedLoads / task.plannedLoads) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 轨迹回放 */}
        <div className="border-t border-neutral-100 pt-3">
          {!playback.active ? (
            <button
              onClick={startPlayback}
              disabled={!canPlayback}
              className={classNames(
                'btn w-full',
                canPlayback ? 'btn-primary' : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              )}
            >
              <History className="w-4 h-4" />
              轨迹回放{canPlayback ? `（${vehicle.trail.length} 个轨迹点）` : '（暂无轨迹）'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                  轨迹回放中
                </span>
                <button
                  onClick={stopPlayback}
                  className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-danger-600 transition-colors"
                >
                  <Square className="w-3 h-3" />
                  结束回放
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlayback}
                  className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors flex-shrink-0"
                  title={playback.playing ? '暂停' : '播放'}
                >
                  {playback.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div className="flex gap-1">
                  {PLAYBACK_SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setPlaybackSpeed(s)}
                      className={classNames(
                        'px-2 py-1 rounded text-xs transition-colors',
                        playback.speed === s
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      )}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={maxIndex}
                value={Math.min(playback.index, maxIndex)}
                onChange={(e) => setPlaybackIndex(Number(e.target.value))}
                className="w-full h-1.5 accent-primary-500 cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>{formatDateTime(currentPoint.timestamp)}</span>
                <span>
                  {Math.min(playback.index, maxIndex) + 1}/{vehicle.trail.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
