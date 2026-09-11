import { create } from 'zustand';
import type { Route, TrackPoint, TrackedVehicle } from '@/types';
import { mockTasks, mockVehicles } from '@/services/mock/data';

/** 定位上报间隔（模拟） */
const TICK_MS = 2000;
/** 模拟时间倍率：让每个上报周期内的位移在地图上可见 */
const SIM_TIME_SCALE = 15;
/** 每个上报周期对应的模拟时长（30 秒） */
const SIM_TICK_MS = TICK_MS * SIM_TIME_SCALE;
/** 初始历史轨迹覆盖时长：8 小时 */
const HISTORY_SPAN_MS = 8 * 60 * 60 * 1000;
/** 每辆车保留的最大轨迹点数 */
const MAX_TRAIL_POINTS = 2000;
/** 公司停车场（无定位车辆默认位置） */
const DEPOT = { lat: 39.8742, lng: 116.3974, address: '公司停车场' };

interface SimState {
  /** 沿路线进度 0-1 */
  progress: number;
  /** 1 = 驶向终点，-1 = 返回起点 */
  direction: 1 | -1;
  /** 端点装卸货剩余停留 tick 数 */
  pauseTicks: number;
  /** 当前速度 km/h */
  speed: number;
  /** 路线弯曲相位（每辆车固定，使路线呈自然弧线） */
  curvePhase: number;
}

/** 车辆内部模拟状态（不进 store） */
const simStates = new Map<string, SimState>();
let timer: ReturnType<typeof setInterval> | null = null;
/** 模拟时钟：轨迹点时间戳与位置推进保持一致 */
let simClock = Date.now();

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** 为车辆匹配任务路线（优先进行中任务） */
const findVehicleTask = (vehicleId: string): { taskId: string; route: Route } | undefined => {
  const vehicleTasks = mockTasks.filter((t) => t.vehicleId === vehicleId);
  if (vehicleTasks.length === 0) return undefined;
  const task = vehicleTasks.find((t) => t.status === 'in_progress') ?? vehicleTasks[0];
  return { taskId: task.id, route: task.route };
};

/** 路线上某进度处的坐标（带弧线弯曲与细微抖动，模拟真实道路走向） */
export const pointOnRoute = (route: Route, progress: number, curvePhase: number) => {
  const { startLocation: s, endLocation: e } = route;
  const dLng = e.lng - s.lng;
  const dLat = e.lat - s.lat;
  const len = Math.hypot(dLng, dLat) || 1;
  // 垂直于路线方向的偏移量：整体弧线 + 高频小幅摆动
  const offset =
    Math.sin(progress * Math.PI) * 0.012 * Math.sin(curvePhase) +
    Math.sin(progress * Math.PI * 6 + curvePhase) * 0.0012;
  return {
    lat: s.lat + dLat * progress + (dLng / len) * offset,
    lng: s.lng + dLng * progress - (dLat / len) * offset,
  };
};

/** 由两点计算航向角（正北为 0，顺时针） */
const calcHeading = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
  return ((Math.atan2(to.lng - from.lng, to.lat - from.lat) * 180) / Math.PI + 360) % 360;
};

const appendPoint = (trail: TrackPoint[], point: TrackPoint): TrackPoint[] => {
  const next = [...trail, point];
  return next.length > MAX_TRAIL_POINTS ? next.slice(next.length - MAX_TRAIL_POINTS) : next;
};

/** 推进一个模拟步，返回新的轨迹点（含端点停留、速度随机游走、往返行驶） */
const nextPoint = (route: Route, sim: SimState, prev: TrackPoint, timestamp: string): TrackPoint => {
  // 端点装卸货停留中
  if (sim.pauseTicks > 0) {
    sim.pauseTicks -= 1;
    return { ...prev, speed: 0, timestamp };
  }

  // 速度随机游走
  sim.speed = clamp(sim.speed + (Math.random() - 0.5) * 10, 22, 65);
  // 按速度推进路线进度：km/h × h = km，除以路线里程
  sim.progress += ((sim.speed * (SIM_TICK_MS / 3600000)) / route.distance) * sim.direction;

  if (sim.progress >= 1) {
    sim.progress = 1;
    sim.direction = -1;
    sim.pauseTicks = 2 + Math.floor(Math.random() * 4);
  } else if (sim.progress <= 0) {
    sim.progress = 0;
    sim.direction = 1;
    sim.pauseTicks = 2 + Math.floor(Math.random() * 4);
  }

  const pos = pointOnRoute(route, sim.progress, sim.curvePhase);
  return {
    ...pos,
    speed: Math.round(sim.speed),
    heading: calcHeading(prev, pos),
    timestamp,
  };
};

/** 生成过去 8 小时的历史轨迹（与实时模拟同一套移动逻辑，含往返与停留） */
const buildInitialTrail = (route: Route, sim: SimState, endTime: number): TrackPoint[] => {
  const startTime = endTime - HISTORY_SPAN_MS;
  const points: TrackPoint[] = [];
  let prev: TrackPoint = {
    ...pointOnRoute(route, sim.progress, sim.curvePhase),
    speed: Math.round(sim.speed),
    heading: 0,
    timestamp: new Date(startTime).toISOString(),
  };
  points.push(prev);
  for (let t = startTime + SIM_TICK_MS; t <= endTime; t += SIM_TICK_MS) {
    prev = nextPoint(route, sim, prev, new Date(t).toISOString());
    points.push(prev);
  }
  return points;
};

/** 从 Mock 车辆与任务构建初始跟踪数据 */
const buildTrackedVehicles = (): TrackedVehicle[] => {
  const now = simClock;
  return mockVehicles.map((vehicle, index) => {
    const taskInfo = findVehicleTask(vehicle.id);

    if (vehicle.status === 'active' && taskInfo) {
      const sim: SimState = {
        progress: 0.05 + ((index * 0.17) % 0.9),
        direction: index % 2 === 0 ? 1 : -1,
        pauseTicks: 0,
        speed: vehicle.currentSpeed ?? 45,
        curvePhase: index * 1.7 + 0.8,
      };
      const trail = buildInitialTrail(taskInfo.route, sim, now);
      simStates.set(vehicle.id, sim);
      return {
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        driverName: vehicle.driverName,
        status: vehicle.status,
        position: trail[trail.length - 1],
        trail,
        taskId: taskInfo.taskId,
        route: taskInfo.route,
      };
    }

    // 非运行车辆：停在停车场，无轨迹
    const position: TrackPoint = {
      lat: (vehicle.currentLocation?.lat ?? DEPOT.lat) + (taskInfo ? 0 : index * 0.0015),
      lng: (vehicle.currentLocation?.lng ?? DEPOT.lng) + (taskInfo ? 0 : index * 0.0015),
      speed: 0,
      heading: 0,
      timestamp: new Date(now).toISOString(),
    };
    return {
      vehicleId: vehicle.id,
      plateNumber: vehicle.plateNumber,
      driverName: vehicle.driverName,
      status: vehicle.status,
      position,
      trail: [position],
      taskId: taskInfo?.taskId,
      route: taskInfo?.route,
    };
  });
};

/** 轨迹查询时间段 */
export interface TimeRange {
  /** 开始时间（ISO 或 datetime-local 值） */
  start: string;
  /** 结束时间（ISO 或 datetime-local 值） */
  end: string;
}

/** 按时间段过滤轨迹点，range 为 null 时返回完整轨迹 */
export const filterTrailByTime = (trail: TrackPoint[], range: TimeRange | null): TrackPoint[] => {
  if (!range) return trail;
  const startMs = new Date(range.start).getTime();
  const endMs = new Date(range.end).getTime();
  return trail.filter((p) => {
    const t = new Date(p.timestamp).getTime();
    return t >= startMs && t <= endMs;
  });
};

interface PlaybackState {
  /** 是否处于回放模式 */
  active: boolean;
  playing: boolean;
  /** 当前回放到的轨迹点下标（基于过滤后的轨迹） */
  index: number;
  /** 回放倍速 */
  speed: 1 | 2 | 4;
}

interface TrackingState {
  vehicles: TrackedVehicle[];
  selectedVehicleId: string | null;
  /** 地图是否跟随选中车辆 */
  followSelected: boolean;
  /** 实时模拟是否运行中 */
  isLive: boolean;
  lastUpdate: string;
  /** 轨迹查询时间段，null 表示全部 */
  timeRange: TimeRange | null;
  playback: PlaybackState;
  startLive: () => void;
  stopLive: () => void;
  selectVehicle: (id: string | null) => void;
  setFollowSelected: (follow: boolean) => void;
  setTimeRange: (range: TimeRange | null) => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  togglePlayback: () => void;
  setPlaybackIndex: (index: number) => void;
  setPlaybackSpeed: (speed: 1 | 2 | 4) => void;
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  vehicles: buildTrackedVehicles(),
  selectedVehicleId: null,
  followSelected: true,
  isLive: false,
  lastUpdate: new Date(simClock).toISOString(),
  timeRange: null,
  playback: { active: false, playing: false, index: 0, speed: 1 },

  startLive: () => {
    if (timer) return;
    set({ isLive: true });
    timer = setInterval(() => {
      simClock += SIM_TICK_MS;
      const timestamp = new Date(simClock).toISOString();
      const state = get();
      const vehicles = state.vehicles.map((tv) => {
        const sim = simStates.get(tv.vehicleId);
        if (!sim || tv.status !== 'active' || !tv.route) return tv;
        const point = nextPoint(tv.route, sim, tv.position, timestamp);
        return { ...tv, position: point, trail: appendPoint(tv.trail, point) };
      });

      let playback = state.playback;
      if (playback.active && playback.playing) {
        const selected = vehicles.find((v) => v.vehicleId === state.selectedVehicleId);
        if (selected) {
          const filtered = filterTrailByTime(selected.trail, state.timeRange);
          if (filtered.length > 1) {
            const maxIndex = filtered.length - 1;
            const next = playback.index + playback.speed;
            // 播放到最新位置后回到起点循环播放
            playback = { ...playback, index: next > maxIndex ? 0 : next };
          }
        }
      }
      set({ vehicles, playback, lastUpdate: timestamp });
    }, TICK_MS);
  },

  stopLive: () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    set({ isLive: false });
  },

  selectVehicle: (id) => {
    set((state) => ({
      selectedVehicleId: id,
      followSelected: true,
      timeRange: null,
      playback: { ...state.playback, active: false, playing: false, index: 0 },
    }));
  },

  setFollowSelected: (follow) => set({ followSelected: follow }),

  setTimeRange: (range) => {
    set((state) => ({
      timeRange: range,
      // 时间段变化后轨迹集合改变，回放进度重置
      playback: { ...state.playback, index: 0, playing: false },
    }));
  },

  startPlayback: () => {
    const { selectedVehicleId, vehicles, timeRange } = get();
    const selected = vehicles.find((v) => v.vehicleId === selectedVehicleId);
    if (!selected) return;
    if (filterTrailByTime(selected.trail, timeRange).length < 2) return;
    set((state) => ({
      playback: { ...state.playback, active: true, playing: true, index: 0 },
    }));
  },

  stopPlayback: () => {
    set((state) => ({
      playback: { ...state.playback, active: false, playing: false, index: 0 },
    }));
  },

  togglePlayback: () => {
    set((state) => ({ playback: { ...state.playback, playing: !state.playback.playing } }));
  },

  setPlaybackIndex: (index) => {
    set((state) => ({ playback: { ...state.playback, index } }));
  },

  setPlaybackSpeed: (speed) => {
    set((state) => ({ playback: { ...state.playback, speed } }));
  },
}));
