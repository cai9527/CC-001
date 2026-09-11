export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Route {
  id: string;
  name: string;
  startLocation: Location;
  endLocation: Location;
  distance: number;
  estimatedTime: number;
}

export interface VehicleDocument {
  id: string;
  type: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
  imageUrl?: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  cost: number;
  mileage: number;
  operator: string;
  organization: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: string;
  loadCapacity: number;
  manufacturer: string;
  model: string;
  year: number;
  mileage: number;
  status: 'active' | 'maintenance' | 'inactive' | 'repair';
  documents: VehicleDocument[];
  maintenanceRecords: MaintenanceRecord[];
  currentLocation?: Location;
  currentSpeed?: number;
  driverId?: string;
  driverName?: string;
  vin: string;
  engineNumber: string;
  purchaseDate: string;
  insuranceExpiry: string;
  operationLicenseExpiry: string;
  inspectionExpiry: string;
  environmentalExpiry: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface Driver {
  id: string;
  name: string;
  gender: 'male' | 'female';
  phone: string;
  idCard: string;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  hireDate: string;
  status: 'on_duty' | 'off_duty' | 'rest' | 'violation';
  totalTrips: number;
  totalDistance: number;
  totalWeight: number;
  violationCount: number;
  avatar?: string;
  drivingYears: number;
  qualificationCert: string;
  qualificationExpiry: string;
  accidentCount: number;
  trainingRecords: { id: string; date: string; name: string; result: string }[];
  physicalExpiry: string;
  emergencyContact: EmergencyContact;
}

export interface TransportTask {
  id: string;
  taskNo: string;
  name: string;
  vehicleId: string;
  driverId: string;
  route: Route;
  materialType: string;
  plannedLoads: number;
  completedLoads: number;
  totalWeight: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  scheduledDate: string;
  plannedTrips: number;
  actualTrips: number;
  material: string;
  plannedQuantity: number;
  actualQuantity: number;
  vehiclePlate: string;
  driverName: string;
  distance: number;
  fromLocation: string;
  toLocation: string;
  transportRecords: TransportRecord[];
  createdAt: string;
}

export interface TransportRecord {
  id: string;
  taskId: string;
  vehicleId: string;
  driverId: string;
  loadNumber: number;
  weight: number;
  departureTime: string;
  arrivalTime: string;
  startLocation: Location;
  endLocation: Location;
  distance: number;
  loadTime: string;
  unloadTime: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
}

export interface SafetyAlert {
  id: string;
  vehicleId: string;
  driverId: string;
  type: 'speeding' | 'fatigue' | 'violation' | 'overload';
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: Location;
  speed?: number;
  speedLimit?: number;
  drivingHours?: number;
  weight?: number;
  maxWeight?: number;
  timestamp: string;
  status: 'pending' | 'processed' | 'ignored';
  processedBy?: string;
  processedAt?: string;
  remark?: string;
  vehiclePlate?: string;
  driverName?: string;
  duration?: string;
  processNote?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  department?: string;
  status: 'active' | 'inactive';
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
}

export type Role = 'admin' | 'manager' | 'dispatcher' | 'safety_officer' | 'fleet_captain';

export interface Permission {
  id: string;
  name: string;
  code: string;
  description: string;
  module: string;
}

export interface RoleConfig {
  id: Role;
  name: string;
  description: string;
  permissions: string[];
}

export interface DailyStatistics {
  date: string;
  totalTrips: number;
  totalWeight: number;
  totalDistance: number;
  vehicleCount: number;
  driverCount: number;
  alertCount: number;
  trips: number;
  avgWeight: number;
  turnover: number;
  fuelConsumption: number;
}

export interface MonthlyStatistics {
  month: string;
  totalTrips: number;
  totalWeight: number;
  totalDistance: number;
  averageDailyTrips: number;
  alertCount: number;
}

export interface VehicleStatistics {
  vehicleId: string;
  plateNumber: string;
  totalTrips: number;
  totalWeight: number;
  totalDistance: number;
  workingDays: number;
  utilizationRate: number;
  driverName: string;
  trips: number;
  completionRate: number;
  turnover: number;
  fuelConsumption: number;
}

export interface DriverPerformance {
  driverId: string;
  driverName: string;
  vehiclePlate: string;
  trips: number;
  totalTrips: number;
  totalWeight: number;
  totalDistance: number;
  workHours: number;
  workingHours: number;
  violationCount: number;
  alertCount: number;
  safetyScore: number;
  efficiencyScore: number;
}

export interface BackupRecord {
  id: string;
  name: string;
  type: 'manual' | 'scheduled';
  size: number;
  status: 'completed' | 'failed' | 'in_progress';
  createdAt: string;
  remark?: string;
}

export interface OperationLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DashboardData {
  todayTrips: number;
  todayWeight: number;
  activeVehicles: number;
  activeTasks: number;
  pendingAlerts: number;
  expiringDocuments: number;
  weeklyTrend: DailyStatistics[];
  vehicleStatusDistribution: { status: string; count: number }[];
  taskCompletionRate: { name: string; value: number }[];
  recentAlerts: SafetyAlert[];
  recentTasks: TransportTask[];
  todayTransportVolume: number;
  avgTurnaroundTime: string;
  todayAlerts: number;
  monthTransportVolume: number;
  totalTransportVolume: number;
}

export const VEHICLE_TYPES = [
  { value: '自卸货车', label: '自卸货车' },
  { value: '渣土车', label: '渣土车' },
  { value: '混凝土搅拌车', label: '混凝土搅拌车' },
  { value: '平板货车', label: '平板货车' },
  { value: '厢式货车', label: '厢式货车' },
];

export const VEHICLE_STATUS: Record<Vehicle['status'], { label: string; class: string; color: string }> = {
  active: { label: '运行中', class: 'badge-success', color: '#10B981' },
  maintenance: { label: '维护中', class: 'badge-warning', color: '#F59E0B' },
  inactive: { label: '闲置', class: 'badge-neutral', color: '#6B7280' },
  repair: { label: '维修中', class: 'badge-danger', color: '#EF4444' },
};

export const DRIVER_STATUS: Record<Driver['status'], { label: string; class: string; color: string }> = {
  on_duty: { label: '在岗', class: 'badge-success', color: '#10B981' },
  off_duty: { label: '离岗', class: 'badge-neutral', color: '#6B7280' },
  rest: { label: '休息', class: 'badge-primary', color: '#165DFF' },
  violation: { label: '违规', class: 'badge-danger', color: '#EF4444' },
};

export const TASK_STATUS: Record<TransportTask['status'], { label: string; class: string; color: string }> = {
  pending: { label: '待执行', class: 'badge-warning', color: '#F59E0B' },
  in_progress: { label: '进行中', class: 'badge-primary', color: '#165DFF' },
  completed: { label: '已完成', class: 'badge-success', color: '#10B981' },
  cancelled: { label: '已取消', class: 'badge-neutral', color: '#6B7280' },
};

export const ALERT_LEVEL: Record<SafetyAlert['level'], { label: string; class: string; color: string }> = {
  low: { label: '低', class: 'badge-primary', color: '#165DFF' },
  medium: { label: '中', class: 'badge-warning', color: '#F59E0B' },
  high: { label: '高', class: 'badge-danger', color: '#EF4444' },
  critical: { label: '严重', class: 'bg-danger-100 text-danger-700 animate-pulse-border', color: '#DC2626' },
};

export const ALERT_TYPE: Record<SafetyAlert['type'], { label: string; icon: string; color: string }> = {
  speeding: { label: '超速', icon: 'Gauge', color: '#EF4444' },
  fatigue: { label: '疲劳驾驶', icon: 'Clock', color: '#F59E0B' },
  violation: { label: '违规行为', icon: 'AlertTriangle', color: '#EF4444' },
  overload: { label: '超载', icon: 'Weight', color: '#F59E0B' },
};

export const ALERT_STATUS: Record<SafetyAlert['status'], { label: string; class: string; color: string }> = {
  pending: { label: '待处理', class: 'badge-warning', color: '#F59E0B' },
  processed: { label: '已处理', class: 'badge-success', color: '#10B981' },
  ignored: { label: '已忽略', class: 'badge-neutral', color: '#6B7280' },
};

export const DOCUMENT_STATUS: Record<VehicleDocument['status'], { label: string; class: string; color: string }> = {
  valid: { label: '有效', class: 'badge-success', color: '#10B981' },
  expiring: { label: '即将到期', class: 'badge-warning', color: '#F59E0B' },
  expired: { label: '已过期', class: 'badge-danger', color: '#EF4444' },
};

export const ROLES: Record<Role, { label: string; description: string; color: string; permissions: string[] }> = {
  admin: {
    label: '系统管理员',
    description: '拥有系统所有权限',
    color: '#165DFF',
    permissions: ['仪表盘', '车辆管理', '任务调度', '驾驶员管理', '运输统计', '安全监控', '系统管理', '用户管理', '数据备份', '日志查看', '权限配置', '系统设置'],
  },
  manager: {
    label: '企业管理者',
    description: '查看数据和报表分析',
    color: '#10B981',
    permissions: ['仪表盘', '车辆管理', '任务调度', '驾驶员管理', '运输统计', '安全监控', '日志查看'],
  },
  dispatcher: {
    label: '调度员',
    description: '任务分配和车辆调度',
    color: '#F59E0B',
    permissions: ['仪表盘', '车辆管理', '任务调度', '驾驶员管理', '运输统计'],
  },
  safety_officer: {
    label: '安全员',
    description: '安全监控和违规处理',
    color: '#EF4444',
    permissions: ['仪表盘', '安全监控', '车辆管理', '驾驶员管理', '运输统计'],
  },
  fleet_captain: {
    label: '车队队长',
    description: '车辆和驾驶员管理',
    color: '#8B5CF6',
    permissions: ['仪表盘', '车辆管理', '驾驶员管理', '任务调度', '运输统计', '安全监控'],
  },
};

export const USER_STATUS: Record<User['status'], { label: string; class: string; color: string }> = {
  active: { label: '正常', class: 'badge-success', color: '#10B981' },
  inactive: { label: '禁用', class: 'badge-neutral', color: '#6B7280' },
};

export const MATERIAL_TYPES = ['渣土', '砂石', '建筑垃圾', '土石方', '其他'];
export const MAINTENANCE_TYPES = ['常规保养', '机油更换', '轮胎更换', '刹车检修', '发动机维修', '其他'];
export const LICENSE_TYPES = ['A1', 'A2', 'A3', 'B1', 'B2', 'C1', 'C2'];
