import { useMemo, useState } from 'react';
import { Truck, MapPin, X, User, Gauge, Crosshair } from 'lucide-react';
import type { Vehicle } from '@/types';
import { VEHICLE_STATUS } from '@/types';
import StatusBadge from '@/components/UI/StatusBadge';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const STATUS_BADGE_VARIANT: Record<Vehicle['status'], BadgeVariant> = {
  active: 'success',
  maintenance: 'warning',
  inactive: 'neutral',
  repair: 'danger',
};

// 地图范围（北京城区），车辆 GPS 坐标通过线性投影映射到 SVG 画布
const BOUNDS = { minLat: 39.84, maxLat: 39.98, minLng: 116.26, maxLng: 116.56 };
const WIDTH = 860;
const HEIGHT = 540;

function project(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * WIDTH;
  const y = (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * HEIGHT;
  return { x, y };
}

// 城市中心（天安门），环线道路以其为圆心
const CENTER = project(39.9042, 116.4074);

const RING_ROADS = [
  { name: '二环路', rx: 86, ry: 85 },
  { name: '三环路', rx: 138, ry: 139 },
  { name: '四环路', rx: 195, ry: 193 },
];

const LANDMARKS: { name: string; lat: number; lng: number; highlight?: boolean }[] = [
  { name: '天安门', lat: 39.9042, lng: 116.4074, highlight: true },
  { name: '北京西站', lat: 39.895, lng: 116.3216 },
  { name: '北京南站', lat: 39.8652, lng: 116.3785 },
  { name: '国贸', lat: 39.9087, lng: 116.4575 },
  { name: '三里屯', lat: 39.937, lng: 116.448 },
  { name: '中关村', lat: 39.975, lng: 116.315 },
  { name: '望京', lat: 39.97, lng: 116.47 },
  { name: '奥体中心', lat: 39.968, lng: 116.39 },
];

const PARKS = [
  { cx: 617, cy: 138, r: 16 }, // 朝阳公园
  { cx: 432, cy: 377, r: 14 }, // 天坛
  { cx: 250, cy: 430, r: 18 }, // 丰台花园（示意）
];

// 主要放射状干道（示意）
const ARTERIAL_ROADS = [
  'M 559 135 L 790 0', // 机场高速
  'M 565 275 L 860 266', // 京通快速
  'M 394 62 L 330 0', // 京藏高速
  'M 640 330 L 860 435', // 京津塘高速
  'M 300 380 L 110 540', // 京港澳高速
  'M 176 328 L 0 300', // 莲石路
];

interface VehicleMapProps {
  vehicles: Vehicle[];
}

export default function VehicleMap({ vehicles }: VehicleMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const locatedVehicles = useMemo(
    () => vehicles.filter((v) => v.currentLocation),
    [vehicles]
  );
  const unlocatedVehicles = useMemo(
    () => vehicles.filter((v) => !v.currentLocation),
    [vehicles]
  );

  const selectedVehicle = locatedVehicles.find((v) => v.id === selectedId) ?? null;

  // 选中的车辆最后渲染，保证其图标在最上层
  const sortedVehicles = useMemo(
    () => [...locatedVehicles].sort((a, b) => (a.id === selectedId ? 1 : b.id === selectedId ? -1 : 0)),
    [locatedVehicles, selectedId]
  );

  const gridLines = useMemo(() => {
    const verticals = Array.from({ length: 13 }, (_, i) => (i + 1) * 61.4);
    const horizontals = Array.from({ length: 8 }, (_, i) => (i + 1) * 60);
    return { verticals, horizontals };
  }, []);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-500" />
          车辆实时定位
        </h3>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-xs text-neutral-400">点击车辆图标查看详情</span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-success-600">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-success-500" />
            </span>
            实时监控 · 已定位 {locatedVehicles.length} 辆
          </span>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto block"
          onClick={() => setSelectedId(null)}
        >
          {/* 街区网格 */}
          {gridLines.verticals.map((x) => (
            <line key={`v${x}`} x1={x} y1={0} x2={x} y2={HEIGHT} stroke="rgba(148,163,184,0.07)" strokeWidth="1" />
          ))}
          {gridLines.horizontals.map((y) => (
            <line key={`h${y}`} x1={0} y1={y} x2={WIDTH} y2={y} stroke="rgba(148,163,184,0.07)" strokeWidth="1" />
          ))}

          {/* 绿地 */}
          {PARKS.map((p, i) => (
            <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="#34D399" opacity="0.14" />
          ))}

          {/* 水系：通惠河（示意） */}
          <path
            d="M 480 300 Q 580 332 680 336 T 860 362"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.3"
          />
          {/* 后海 / 北海 */}
          <ellipse cx={project(39.935, 116.39).x} cy={project(39.935, 116.39).y} rx="16" ry="7" fill="#38BDF8" opacity="0.25" />
          <ellipse cx={project(39.9256, 116.3895).x} cy={project(39.9256, 116.3895).y} rx="11" ry="9" fill="#38BDF8" opacity="0.25" />

          {/* 环线道路 */}
          {RING_ROADS.map((ring) => (
            <g key={ring.name}>
              <ellipse
                cx={CENTER.x}
                cy={CENTER.y}
                rx={ring.rx}
                ry={ring.ry}
                fill="none"
                stroke="#64748B"
                strokeWidth={ring.name === '二环路' ? 2 : 1.2}
                opacity={ring.name === '二环路' ? 0.55 : 0.35}
              />
              <text
                x={CENTER.x}
                y={CENTER.y - ring.ry - 4}
                textAnchor="middle"
                fontSize="9"
                fill="#64748B"
              >
                {ring.name}
              </text>
            </g>
          ))}

          {/* 长安街 / 中轴线 */}
          <line x1={0} y1={CENTER.y} x2={WIDTH} y2={CENTER.y} stroke="#94A3B8" strokeWidth="2.5" opacity="0.4" />
          <line x1={CENTER.x} y1={0} x2={CENTER.x} y2={HEIGHT} stroke="#94A3B8" strokeWidth="2" opacity="0.3" />

          {/* 放射状干道 */}
          {ARTERIAL_ROADS.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#64748B" strokeWidth="1.5" opacity="0.3" />
          ))}

          {/* 地标 */}
          {LANDMARKS.map((lm) => {
            const { x, y } = project(lm.lat, lm.lng);
            return (
              <g key={lm.name}>
                <circle cx={x} cy={y} r={lm.highlight ? 3.5 : 2.5} fill={lm.highlight ? '#F87171' : '#94A3B8'} opacity={lm.highlight ? 1 : 0.7} />
                <text
                  x={lm.highlight ? x - 8 : x}
                  y={lm.highlight ? y - 8 : y - 6}
                  textAnchor={lm.highlight ? 'end' : 'middle'}
                  fontSize="10"
                  fill={lm.highlight ? '#FCA5A5' : '#94A3B8'}
                >
                  {lm.name}
                </text>
              </g>
            );
          })}

          {/* 车辆图标 */}
          {sortedVehicles.map((vehicle) => {
            const loc = vehicle.currentLocation!;
            const { x, y } = project(loc.lat, loc.lng);
            const color = VEHICLE_STATUS[vehicle.status].color;
            const isSelected = vehicle.id === selectedId;
            const isHovered = vehicle.id === hoveredId;
            return (
              <g
                key={vehicle.id}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(isSelected ? null : vehicle.id);
                }}
                onMouseEnter={() => setHoveredId(vehicle.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* 运行中车辆的脉冲光圈 */}
                {vehicle.status === 'active' && (
                  <circle r="11" fill={color}>
                    <animate attributeName="r" values="11;26" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
                {(isSelected || isHovered) && (
                  <circle r="15" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
                )}
                <circle r="11" fill={color} stroke="#fff" strokeWidth="2" />
                <Truck x={-7} y={-7} width={14} height={14} color="#fff" strokeWidth={2.25} />
                {/* 车牌标签 */}
                <g transform="translate(0, 23)">
                  <rect
                    x="-29"
                    y="-8"
                    width="58"
                    height="16"
                    rx="8"
                    fill="rgba(15,23,42,0.85)"
                    stroke={color}
                    strokeWidth={isSelected ? 1.5 : 0.75}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10"
                    fontWeight="500"
                    fill="#E2E8F0"
                  >
                    {vehicle.plateNumber}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* 左上角实时徽标 */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-600/60 backdrop-blur">
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-400" />
          </span>
          <span className="text-[11px] font-medium tracking-wide text-emerald-300">LIVE GPS</span>
        </div>

        {/* 右下角指北针与比例尺 */}
        <div className="absolute bottom-3 right-3 flex items-end gap-3 text-slate-400">
          <div className="flex flex-col items-center gap-1">
            <div className="h-1.5 w-16 rounded-full overflow-hidden flex border border-slate-500">
              <div className="w-1/2 h-full bg-slate-300" />
              <div className="w-1/2 h-full bg-slate-600" />
            </div>
            <span className="text-[10px]">5 公里</span>
          </div>
          <div className="flex flex-col items-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
              <path d="M12 5 L15 13 L12 11.5 L9 13 Z" fill="#F87171" />
            </svg>
            <span className="text-[10px]">北</span>
          </div>
        </div>

        {/* 选中车辆详情面板 */}
        {selectedVehicle && (
          <div className="absolute top-3 right-3 w-64 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-600/60 p-4 text-slate-200 shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${VEHICLE_STATUS[selectedVehicle.status].color}26` }}
                >
                  <Truck className="w-4 h-4" style={{ color: VEHICLE_STATUS[selectedVehicle.status].color }} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">{selectedVehicle.plateNumber}</p>
                  <p className="text-[11px] text-slate-400">{selectedVehicle.vehicleType}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mb-3">
              <StatusBadge variant={STATUS_BADGE_VARIANT[selectedVehicle.status]}>
                {VEHICLE_STATUS[selectedVehicle.status].label}
              </StatusBadge>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 w-14">驾驶员</span>
                <span>{selectedVehicle.driverName || '未分配'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 w-14">速度</span>
                <span>{selectedVehicle.currentSpeed ?? 0} km/h</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 w-14">位置</span>
                <span className="flex-1 truncate">{selectedVehicle.currentLocation?.address || '未知'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 w-14">经纬度</span>
                <span>
                  {selectedVehicle.currentLocation?.lat.toFixed(4)},{' '}
                  {selectedVehicle.currentLocation?.lng.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 图例与未定位车辆 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <div className="flex items-center gap-4">
          {Object.entries(VEHICLE_STATUS).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: val.color }} />
              <span className="text-xs text-neutral-600">{val.label}</span>
            </div>
          ))}
        </div>
        {unlocatedVehicles.length > 0 && (
          <p className="text-xs text-neutral-400">
            未定位 {unlocatedVehicles.length} 辆：
            {unlocatedVehicles.map((v) => v.plateNumber).join('、')}
          </p>
        )}
      </div>
    </div>
  );
}
