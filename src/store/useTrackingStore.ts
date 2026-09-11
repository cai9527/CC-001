import { create } from 'zustand';
import type { Route, TrackPoint, TrackedVehicle } from '@/types';
import { mockTasks, mockVehicles } from '@/services/mock/data';

/** 定位上报间隔（模拟） */
const TICK_MS = 2000;
/** 模拟时间倍率：让每个上报周期内的位移在地图上可见 */
const SIM_TIME_SCALE = 15;
/** 每辆车保留的最大轨迹点数 */
const MAX_TRAIL_POINTS = 300;
/** 初始化时生成的历史轨迹点数 */
const HISTORY_POINTS = 60;
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

/** 推进一辆车的模拟状态，返回新的跟踪数据 */
const tickVehicle = (tv: TrackedVehicle, sim: SimState, now: Date): TrackedVehicle => {
  if (tv.status !== 'active' || !tv.route) return tv;

  // 端点装卸货停留中
  if (sim.pauseTicks > 0) {
    sim.pauseTicks -= 1;
    const point: TrackPoint = { ...tv.position, speed: 0, timestamp: now.toISOString() };
    return { ...tv, position: point, trail: appendPoint(tv.trail, point) };
  }

  // 速度随机游走
  sim.speed = clamp(sim.speed + (Math.random() - 0.5) * 10, 22, 65);
  // 按速度推进路线进度：km/h × h = km，除以路线里程（乘模拟时间倍率）
  sim.progress += ((sim.speed * (TICK_MS / 3600000) * SIM_TIME_SCALE) / tv.route.distance) * sim.direction;

  if (sim.progress >= 1) {
    sim.progress = 1;
    sim.direction = -1;
    sim.pauseTicks = 2 + Math.floor(Math.random() * 4);
  } else if (sim.progress <= 0) {
    sim.progress = 0;
    sim.direction = 1;
    sim.pauseTicks = 2 + Math.floor(Math.random() * 4);
  }

  const pos = pointOnRoute(tv.route, sim.progress, sim.curvePhase);
  const point: TrackPoint = {
    ...pos,
    speed: Math.round(sim.speed),
    heading: calcHeading(tv.position, pos),
    timestamp: now.toISOString(),
  };
  return { ...tv, position: point, trail: appendPoint(tv.trail, point) };
};

/** 生成车辆初始历史轨迹（沿路线回溯一段行程） */
const buildInitialTrail = (
  route: Route,
  endProgress: number,
  curvePhase: number,
  now: Date
): TrackPoint[] => {
  const points: TrackPoint[] = [];
  const step = 0.004; // 每个历史点的进度间隔
  const startProgress = Math.max(0.02, endProgress - HISTORY_POINTS * step);
  let prev = pointOnRoute(route, startProgress, curvePhase);
  for (let i = 0; i <= HISTORY_POINTS; i++) {
    const progress = startProgress + (endProgress - startProgress) * (i / HISTORY_POINTS);
    const pos = pointOnRoute(route, progress, curvePhase);
    points.push({
      ...pos,
      speed: 30 + Math.round(Math.random() * 25),
      heading: calcHeading(prev, pos),
      timestamp: new Date(now.getTime() - (HISTORY_POINTS - i) * TICK_MS * 3).toISOString(),
    });
    prev = pos;
  }
  return points;
};

/** 从 Mock 车辆与任务构建初始跟踪数据 */
const buildTrackedVehicles = (): TrackedVehicle[] => {
  const now = new Date();
  return mockVehicles.map((vehicle, index) => {
    const taskInfo = findVehicleTask(vehicle.id);

    if (vehicle.status === 'active' && taskInfo) {
      const curvePhase = index * 1.7 + 0.8;
      const progress = 0.25 + ((index * 0.13) % 0.6);
      const trail = buildInitialTrail(taskInfo.route, progress, curvePhase, now);
      const position = trail[trail.length - 1];
      simStates.set(vehicle.id, {
        progress,
        direction: 1,
        pauseTicks: 0,
        speed: vehicle.currentSpeed ?? 45,
        curvePhase,
      });
      return {
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        driverName: vehicle.driverName,
        status: vehicle.status,
        position,
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
      timestamp: now.toISOString(),
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

interface PlaybackState {
  /** 是否处于回放模式 */
  active: boolean;
  playing: boolean;
  /** 当前回放到的轨迹点下标 */
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
  playback: PlaybackState;
  startLive: () => void;
  stopLive: () => void;
  selectVehicle: (id: string | null) => void;
  setFollowSelected: (follow: boolean) => void;
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
  lastUpdate: new Date().toISOString(),
  playback: { active: false, playing: false, index: 0, speed: 1 },

  startLive: () => {
    if (timer) return;
    set({ isLive: true });
    timer = setInterval(() => {
      const state = get();
      const now = new Date();
      const vehicles = state.vehicles.map((tv) => {
        const sim = simStates.get(tv.vehicleId);
        return sim ? tickVehicle(tv, sim, now) : tv;
      });

      let playback = state.playback;
      if (playback.active && playback.playing) {
        const selected = vehicles.find((v) => v.vehicleId === state.selectedVehicleId);
        if (selected && selected.trail.length > 1) {
          const maxIndex = selected.trail.length - 1;
          const next = playback.index + playback.speed;
          // 播放到最新位置后回到起点循环播放
          playback = { ...playback, index: next > maxIndex ? 0 : next };
        }
      }
      set({ vehicles, playback, lastUpdate: now.toISOString() });
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
      playback: { ...state.playback, active: false, playing: false, index: 0 },
    }));
  },

  setFollowSelected: (follow) => set({ followSelected: follow }),

  startPlayback: () => {
    const { selectedVehicleId, vehicles } = get();
    const selected = vehicles.find((v) => v.vehicleId === selectedVehicleId);
    if (!selected || selected.trail.length < 2) return;
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
