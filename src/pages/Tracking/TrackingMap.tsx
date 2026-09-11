import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Minus, Maximize2, Crosshair } from 'lucide-react';
import { pointOnRoute, useTrackingStore } from '@/store/useTrackingStore';
import { VEHICLE_STATUS } from '@/types';
import type { TrackPoint, TrackedVehicle } from '@/types';
import { classNames } from '@/utils';

/** 地图画布基准尺寸 */
const BASE_W = 1000;
const BASE_H = 620;
/** 跟随模式下的视野宽度 */
const FOLLOW_W = 420;

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Projection {
  project: (lat: number, lng: number) => { x: number; y: number };
}

/** 由全部车辆位置与路线端点计算等距投影（组件生命周期内固定，避免地图跳动） */
const buildProjection = (vehicles: TrackedVehicle[]): Projection => {
  const lats: number[] = [];
  const lngs: number[] = [];
  vehicles.forEach((v) => {
    lats.push(v.position.lat);
    lngs.push(v.position.lng);
    if (v.route) {
      lats.push(v.route.startLocation.lat, v.route.endLocation.lat);
      lngs.push(v.route.startLocation.lng, v.route.endLocation.lng);
    }
  });
  const latRange = Math.max(...lats) - Math.min(...lats) || 0.01;
  const lngRange = Math.max(...lngs) - Math.min(...lngs) || 0.01;
  const minLat = Math.min(...lats) - latRange * 0.18;
  const maxLat = Math.max(...lats) + latRange * 0.18;
  const minLng = Math.min(...lngs) - lngRange * 0.18;
  const maxLng = Math.max(...lngs) + lngRange * 0.18;
  const scale = Math.min(BASE_W / (maxLng - minLng), BASE_H / (maxLat - minLat));
  const offX = (BASE_W - (maxLng - minLng) * scale) / 2;
  const offY = (BASE_H - (maxLat - minLat) * scale) / 2;
  return {
    project: (lat, lng) => ({
      x: offX + (lng - minLng) * scale,
      y: offY + (maxLat - lat) * scale,
    }),
  };
};

/** 模拟路网背景（归一化坐标，渲染时缩放到画布） */
const ROADS_V = [0.12, 0.26, 0.4, 0.54, 0.68, 0.82, 0.93];
const ROADS_H = [0.14, 0.3, 0.46, 0.62, 0.78, 0.9];
const AVENUES: string[] = [
  `M ${BASE_W * 0.02} ${BASE_H * 0.85} L ${BASE_W * 0.98} ${BASE_H * 0.12}`,
  `M ${BASE_W * 0.1} ${BASE_H * 0.05} L ${BASE_W * 0.9} ${BASE_H * 0.98}`,
];
const PARKS = [
  { x: 0.06, y: 0.52, w: 0.1, h: 0.14 },
  { x: 0.72, y: 0.2, w: 0.12, h: 0.1 },
  { x: 0.3, y: 0.08, w: 0.09, h: 0.09 },
];
const DISTRICT_LABELS = [
  { name: '东城区', lat: 39.9288, lng: 116.4163 },
  { name: '西城区', lat: 39.9126, lng: 116.3658 },
  { name: '朝阳区', lat: 39.9219, lng: 116.4436 },
  { name: '丰台区', lat: 39.8652, lng: 116.372 },
  { name: '大兴区', lat: 39.856, lng: 116.356 },
];

const FULL_VIEW: ViewBox = { x: 0, y: 0, w: BASE_W, h: BASE_H };

const clampView = (v: ViewBox): ViewBox => {
  const w = Math.min(Math.max(v.w, 140), BASE_W);
  const h = (w / v.w) * v.h || v.h;
  const clampedH = Math.min(h, BASE_H);
  return {
    w,
    h: clampedH,
    x: Math.min(Math.max(v.x, 0), BASE_W - w),
    y: Math.min(Math.max(v.y, 0), BASE_H - clampedH),
  };
};

export default function TrackingMap() {
  const {
    vehicles,
    selectedVehicleId,
    followSelected,
    playback,
    selectVehicle,
    setFollowSelected,
  } = useTrackingStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const [projection] = useState<Projection>(() => buildProjection(vehicles));
  const [view, setView] = useState<ViewBox>(FULL_VIEW);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; view: ViewBox } | null>(null);
  /** 本次拖拽是否发生过位移（用于抑制拖拽后的 click 取消选中） */
  const movedRef = useRef(false);

  const selected = vehicles.find((v) => v.vehicleId === selectedVehicleId);
  const playbackPoint: TrackPoint | undefined =
    playback.active && selected ? selected.trail[Math.min(playback.index, selected.trail.length - 1)] : undefined;

  /** 以某视野中心缩放 */
  const zoomAt = useCallback((factor: number, cx?: number, cy?: number) => {
    setView((v) => {
      const centerX = cx ?? v.x + v.w / 2;
      const centerY = cy ?? v.y + v.h / 2;
      const newW = v.w * factor;
      const newH = v.h * factor;
      return clampView({
        x: centerX - ((centerX - v.x) / v.w) * newW,
        y: centerY - ((centerY - v.y) / v.h) * newH,
        w: newW,
        h: newH,
      });
    });
  }, []);

  // 滚轮缩放（需要非被动监听以阻止页面滚动）
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      setView((v) => {
        const cx = v.x + ((e.clientX - rect.left) / rect.width) * v.w;
        const cy = v.y + ((e.clientY - rect.top) / rect.height) * v.h;
        const factor = e.deltaY > 0 ? 1.2 : 0.85;
        const newW = v.w * factor;
        const newH = v.h * factor;
        return clampView({
          x: cx - ((cx - v.x) / v.w) * newW,
          y: cy - ((cy - v.y) / v.h) * newH,
          w: newW,
          h: newH,
        });
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  // 跟随选中车辆：位置更新时视野居中
  const selectedLat = selected?.position.lat;
  const selectedLng = selected?.position.lng;
  useEffect(() => {
    if (!followSelected || selectedLat === undefined || selectedLng === undefined) return;
    const { x, y } = projection.project(selectedLat, selectedLng);
    setView((v) => {
      const w = v.w >= BASE_W ? FOLLOW_W : v.w;
      const h = (w / BASE_W) * BASE_H;
      return clampView({ x: x - w / 2, y: y - h / 2, w, h });
    });
  }, [followSelected, selectedLat, selectedLng, selectedVehicleId, projection]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, view };
    movedRef.current = false;
    setIsDragging(true);
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.startX) / rect.width) * drag.view.w;
    const dy = ((e.clientY - drag.startY) / rect.height) * drag.view.h;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      movedRef.current = true;
      // 用户手动拖拽后退出跟随模式
      if (followSelected) setFollowSelected(false);
      setView(clampView({ ...drag.view, x: drag.view.x - dx, y: drag.view.y - dy }));
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const onMapClick = () => {
    // 拖拽结束后的 click 不取消选中
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    selectVehicle(null);
  };

  const toggleFollow = () => {
    if (!selectedVehicleId) return;
    setFollowSelected(!followSelected);
  };

  /** 规划路线采样点 */
  const plannedRoutePoints = (tv: TrackedVehicle): string => {
    if (!tv.route) return '';
    const pts: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const pos = pointOnRoute(tv.route, i / 40, 0.8 + vehicles.indexOf(tv) * 1.7);
      const { x, y } = projection.project(pos.lat, pos.lng);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  };

  const trailPoints = (trail: TrackPoint[]): string =>
    trail
      .map((p) => {
        const { x, y } = projection.project(p.lat, p.lng);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const renderVehicleMarker = (tv: TrackedVehicle) => {
    const isSelected = tv.vehicleId === selectedVehicleId;
    // 回放模式下选中车辆的实时标记由回放标记替代
    if (isSelected && playback.active) return null;
    const color = VEHICLE_STATUS[tv.status].color;
    const { x, y } = projection.project(tv.position.lat, tv.position.lng);
    const moving = tv.status === 'active' && tv.position.speed > 0;
    return (
      <g
        key={tv.vehicleId}
        transform={`translate(${x}, ${y})`}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          selectVehicle(tv.vehicleId);
        }}
      >
        {isSelected && (
          <circle r="16" fill={color} opacity="0.2">
            <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        {moving && (
          <path
            d="M 0 -14 L 5 -6 L -5 -6 Z"
            fill={color}
            transform={`rotate(${tv.position.heading})`}
            opacity="0.9"
          />
        )}
        <circle r={isSelected ? 9 : 7} fill={color} stroke="#fff" strokeWidth="2.5" />
        <circle r="2.5" fill="#fff" />
        <g transform="translate(0, 14)" pointerEvents="none">
          <rect
            x="-38"
            y="0"
            width="76"
            height="17"
            rx="4"
            fill={isSelected ? color : 'rgba(255,255,255,0.95)'}
            stroke={color}
            strokeWidth="1"
          />
          <text
            y="12.5"
            textAnchor="middle"
            fontSize="11"
            fontWeight={isSelected ? 600 : 400}
            fill={isSelected ? '#fff' : '#272E3B'}
          >
            {tv.plateNumber}
          </text>
        </g>
      </g>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[420px] bg-[#E9EFE7] rounded overflow-hidden select-none">
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className={classNames('w-full h-full block', isDragging ? 'cursor-grabbing' : 'cursor-grab')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={onMapClick}
      >
        {/* ===== 模拟地图底图 ===== */}
        <rect x="0" y="0" width={BASE_W} height={BASE_H} fill="#EDF2EA" />
        {/* 水系 */}
        <path
          d={`M -20 ${BASE_H * 0.72} Q ${BASE_W * 0.3} ${BASE_H * 0.6} ${BASE_W * 0.52} ${BASE_H * 0.72} T ${BASE_W + 20} ${BASE_H * 0.62} L ${BASE_W + 20} ${BASE_H + 20} L -20 ${BASE_H + 20} Z`}
          fill="#CFE3F5"
        />
        <ellipse cx={BASE_W * 0.16} cy={BASE_H * 0.2} rx={BASE_W * 0.05} ry={BASE_H * 0.045} fill="#CFE3F5" />
        {/* 公园绿地 */}
        {PARKS.map((p, i) => (
          <rect
            key={i}
            x={p.x * BASE_W}
            y={p.y * BASE_H}
            width={p.w * BASE_W}
            height={p.h * BASE_H}
            rx="10"
            fill="#D8EAD3"
          />
        ))}
        {/* 支路网 */}
        {ROADS_V.map((fx) => (
          <line key={`v${fx}`} x1={fx * BASE_W} y1="0" x2={fx * BASE_W} y2={BASE_H} stroke="#FFFFFF" strokeWidth="5" />
        ))}
        {ROADS_H.map((fy) => (
          <line key={`h${fy}`} x1="0" y1={fy * BASE_H} x2={BASE_W} y2={fy * BASE_H} stroke="#FFFFFF" strokeWidth="5" />
        ))}
        {/* 主干道 */}
        {AVENUES.map((d, i) => (
          <g key={i}>
            <path d={d} stroke="#D9DEE4" strokeWidth="13" fill="none" />
            <path d={d} stroke="#FFFFFF" strokeWidth="10" fill="none" />
          </g>
        ))}
        {/* 环路 */}
        <ellipse
          cx={BASE_W * 0.5}
          cy={BASE_H * 0.46}
          rx={BASE_W * 0.3}
          ry={BASE_H * 0.3}
          fill="none"
          stroke="#D9DEE4"
          strokeWidth="14"
        />
        <ellipse
          cx={BASE_W * 0.5}
          cy={BASE_H * 0.46}
          rx={BASE_W * 0.3}
          ry={BASE_H * 0.3}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="11"
        />
        {/* 区域标注 */}
        {DISTRICT_LABELS.map((d) => {
          const { x, y } = projection.project(d.lat, d.lng);
          return (
            <text
              key={d.name}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="14"
              fill="#86909C"
              letterSpacing="4"
              pointerEvents="none"
            >
              {d.name}
            </text>
          );
        })}

        {/* ===== 选中车辆：规划路线 + 起终点 ===== */}
        {selected?.route && (
          <g pointerEvents="none">
            <polyline
              points={plannedRoutePoints(selected)}
              fill="none"
              stroke="#86909C"
              strokeWidth="2.5"
              strokeDasharray="7 6"
              strokeLinecap="round"
              opacity="0.8"
            />
            {(() => {
              const s = projection.project(selected.route.startLocation.lat, selected.route.startLocation.lng);
              const e = projection.project(selected.route.endLocation.lat, selected.route.endLocation.lng);
              return (
                <>
                  <g transform={`translate(${s.x}, ${s.y})`}>
                    <circle r="9" fill="#00B42A" stroke="#fff" strokeWidth="2.5" />
                    <text y="4" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="600">起</text>
                    <text y="26" textAnchor="middle" fontSize="11" fill="#4E5969">
                      {selected.route.startLocation.address}
                    </text>
                  </g>
                  <g transform={`translate(${e.x}, ${e.y})`}>
                    <circle r="9" fill="#F53F3F" stroke="#fff" strokeWidth="2.5" />
                    <text y="4" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="600">终</text>
                    <text y="26" textAnchor="middle" fontSize="11" fill="#4E5969">
                      {selected.route.endLocation.address}
                    </text>
                  </g>
                </>
              );
            })()}
          </g>
        )}

        {/* ===== 选中车辆：历史轨迹 ===== */}
        {selected && selected.trail.length > 1 && (
          <g pointerEvents="none">
            <polyline
              points={trailPoints(selected.trail)}
              fill="none"
              stroke="#165DFF"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.15"
            />
            <polyline
              points={trailPoints(selected.trail)}
              fill="none"
              stroke="#165DFF"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          </g>
        )}

        {/* ===== 车辆实时标记 ===== */}
        {vehicles.map(renderVehicleMarker)}

        {/* ===== 回放标记 ===== */}
        {playback.active && playbackPoint && selected && (
          <g transform={`translate(${projection.project(playbackPoint.lat, playbackPoint.lng).x}, ${projection.project(playbackPoint.lat, playbackPoint.lng).y})`} pointerEvents="none">
            <circle r="14" fill="#165DFF" opacity="0.25">
              <animate attributeName="r" values="10;18;10" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.08;0.4" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <path
              d="M 0 -15 L 5.5 -6 L -5.5 -6 Z"
              fill="#165DFF"
              transform={`rotate(${playbackPoint.heading})`}
            />
            <circle r="8" fill="#165DFF" stroke="#fff" strokeWidth="2.5" />
            <circle r="2.5" fill="#fff" />
            <g transform="translate(0, 16)">
              <rect x="-38" y="0" width="76" height="17" rx="4" fill="#165DFF" />
              <text y="12.5" textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff">
                {selected.plateNumber}
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* ===== 地图控制按钮 ===== */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
        <button
          onClick={() => zoomAt(0.75)}
          className="w-8 h-8 bg-white rounded shadow-card flex items-center justify-center text-neutral-600 hover:text-primary-600 transition-colors"
          title="放大"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoomAt(1.35)}
          className="w-8 h-8 bg-white rounded shadow-card flex items-center justify-center text-neutral-600 hover:text-primary-600 transition-colors"
          title="缩小"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setView(FULL_VIEW)}
          className="w-8 h-8 bg-white rounded shadow-card flex items-center justify-center text-neutral-600 hover:text-primary-600 transition-colors"
          title="全图"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFollow}
          disabled={!selectedVehicleId}
          className={classNames(
            'w-8 h-8 rounded shadow-card flex items-center justify-center transition-colors',
            followSelected && selectedVehicleId
              ? 'bg-primary-500 text-white'
              : 'bg-white text-neutral-600 hover:text-primary-600',
            !selectedVehicleId && 'opacity-40 cursor-not-allowed'
          )}
          title="跟随选中车辆"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* ===== 图例 ===== */}
      <div className="absolute left-3 bottom-3 bg-white/95 rounded shadow-card px-3 py-2 space-y-1.5 text-xs text-neutral-600">
        {Object.entries(VEHICLE_STATUS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: val.color }} />
            <span>{val.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-primary-500 rounded" />
          <span>行驶轨迹</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 border-t-2 border-dashed border-neutral-400" />
          <span>规划路线</span>
        </div>
      </div>
    </div>
  );
}
