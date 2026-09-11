import { useState, useEffect } from 'react';
import {
  Truck,
  Users,
  ClipboardList,
  BarChart3,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Activity,
  HardDrive,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useStatisticsStore } from '@/store/useStatisticsStore';
import { useVehicleStore } from '@/store/useVehicleStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useSafetyStore } from '@/store/useSafetyStore';
import { useDriverStore } from '@/store/useDriverStore';
import StatCard from '@/components/Charts/StatCard';
import StatusBadge from '@/components/UI/StatusBadge';
import { VEHICLE_STATUS, TASK_STATUS } from '@/types';
import { formatWeight, formatNumber, formatDateTime, classNames } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { dashboardData, dailyStats } = useStatisticsStore();
  const { vehicles } = useVehicleStore();
  const { tasks } = useTaskStore();
  const { alerts } = useSafetyStore();
  const { drivers } = useDriverStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const onlineVehicles = vehicles.filter((v) => v.status === 'active').length;
  const activeDrivers = drivers.filter((d) => d.status === 'on_duty').length;
  const activeTasks = tasks.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  ).length;
  const pendingAlerts = alerts.filter((a) => a.status === 'pending').length;

  const activeVehiclesList = vehicles
    .filter((v) => v.status === 'active')
    .slice(0, 6);

  const recentTasks = tasks.slice(0, 5);
  const recentAlerts = alerts.filter((a) => a.status === 'pending').slice(0, 5);

  const quickLinks = [
    { label: '新增车辆', icon: Truck, path: '/vehicles', color: 'primary' as const },
    { label: '新增任务', icon: ClipboardList, path: '/tasks', color: 'success' as const },
    { label: '新增驾驶员', icon: Users, path: '/drivers', color: 'warning' as const },
    { label: '查看预警', icon: ShieldAlert, path: '/safety', color: 'danger' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">仪表盘</h1>
          <p className="text-sm text-neutral-500 mt-1">
            实时监控运营数据，掌握全局运营状态
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-500">
            {currentTime.toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
          <p className="text-2xl font-bold text-primary-600">
            {currentTime.toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="在线车辆"
          value={onlineVehicles}
          unit="辆"
          icon={<Truck className="w-6 h-6" />}
          trend={{ value: 5.2, direction: 'up' }}
          color="primary"
          onClick={() => navigate('/vehicles')}
        />
        <StatCard
          title="在岗驾驶员"
          value={activeDrivers}
          unit="人"
          icon={<Users className="w-6 h-6" />}
          trend={{ value: 3.8, direction: 'up' }}
          color="success"
          onClick={() => navigate('/drivers')}
        />
        <StatCard
          title="进行中任务"
          value={activeTasks}
          unit="个"
          icon={<ClipboardList className="w-6 h-6" />}
          trend={{ value: 2.1, direction: 'up' }}
          color="warning"
          onClick={() => navigate('/tasks')}
        />
        <StatCard
          title="待处理预警"
          value={pendingAlerts}
          unit="条"
          icon={<ShieldAlert className="w-6 h-6" />}
          trend={{ value: 15.3, direction: 'down' }}
          color="danger"
          onClick={() => navigate('/safety')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-500" />
                运输量趋势
              </h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                  <span className="text-neutral-600">运输量(吨)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                  <span className="text-neutral-600">趟次</span>
                </div>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#165DFF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#165DFF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#36D399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#36D399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} yAxisId="left" />
                  <YAxis
                    stroke="#6B7280"
                    fontSize={12}
                    yAxisId="right"
                    orientation="right"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalWeight"
                    stroke="#165DFF"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWeight)"
                    name="运输量(吨)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="trips"
                    stroke="#36D399"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTrips)"
                    name="趟次"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary-500" />
                  在线车辆
                </h3>
                <button
                  onClick={() => navigate('/vehicles')}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  查看全部 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {activeVehiclesList.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                    onClick={() => navigate('/vehicles')}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-success-500 rounded-full border-2 border-white animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-800">{vehicle.plateNumber}</p>
                      <p className="text-xs text-neutral-500">{vehicle.model}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge variant="success">运行中</StatusBadge>
                    </div>
                  </div>
                ))}
                {activeVehiclesList.length === 0 && (
                  <div className="text-center py-8 text-neutral-500 text-sm">
                    暂无在线车辆
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-500" />
                  快速操作
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {quickLinks.map((link, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(link.path)}
                    className={classNames(
                      'p-4 rounded-xl text-left transition-all hover:shadow-md',
                      link.color === 'primary' && 'bg-primary-50 hover:bg-primary-100',
                      link.color === 'success' && 'bg-success-50 hover:bg-success-100',
                      link.color === 'warning' && 'bg-warning-50 hover:bg-warning-100',
                      link.color === 'danger' && 'bg-danger-50 hover:bg-danger-100'
                    )}
                  >
                    <div
                      className={classNames(
                        'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                        link.color === 'primary' && 'bg-primary-100',
                        link.color === 'success' && 'bg-success-100',
                        link.color === 'warning' && 'bg-warning-100',
                        link.color === 'danger' && 'bg-danger-100'
                      )}
                    >
                      <link.icon
                        className={classNames(
                          'w-5 h-5',
                          link.color === 'primary' && 'text-primary-600',
                          link.color === 'success' && 'text-success-600',
                          link.color === 'warning' && 'text-warning-600',
                          link.color === 'danger' && 'text-danger-600'
                        )}
                      />
                    </div>
                    <p
                      className={classNames(
                        'font-medium',
                        link.color === 'primary' && 'text-primary-700',
                        link.color === 'success' && 'text-success-700',
                        link.color === 'warning' && 'text-warning-700',
                        link.color === 'danger' && 'text-danger-700'
                      )}
                    >
                      {link.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary-500" />
                最近任务
              </h3>
              <button
                onClick={() => navigate('/tasks')}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 text-neutral-600 font-medium">任务编号</th>
                    <th className="text-left py-3 text-neutral-600 font-medium">物料</th>
                    <th className="text-left py-3 text-neutral-600 font-medium">车辆</th>
                    <th className="text-left py-3 text-neutral-600 font-medium">进度</th>
                    <th className="text-left py-3 text-neutral-600 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((task) => {
                    const progress =
                      task.status === 'completed'
                        ? 100
                        : Math.round((task.actualTrips / task.plannedTrips) * 100);
                    return (
                      <tr
                        key={task.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                        onClick={() => navigate('/tasks')}
                      >
                        <td className="py-3 font-medium text-primary-600">{task.taskNo}</td>
                        <td className="py-3">{task.material}</td>
                        <td className="py-3">{task.vehiclePlate}</td>
                        <td className="py-3 w-32">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-neutral-600">
                              {task.actualTrips}/{task.plannedTrips}趟
                            </span>
                            <span className="font-medium text-primary-600">{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3">
                          <StatusBadge variant={TASK_STATUS[task.status].color as any}>
                            {TASK_STATUS[task.status].label}
                          </StatusBadge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-neutral-800 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              今日概览
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <HardDrive className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">今日运输量</p>
                    <p className="text-xl font-bold text-primary-600">
                      {formatWeight(dashboardData.todayTransportVolume)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-success-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">12.5%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">今日运输趟次</p>
                    <p className="text-xl font-bold text-success-600">
                      {formatNumber(dashboardData.todayTrips)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-success-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">8.3%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">平均周转时间</p>
                    <p className="text-xl font-bold text-warning-600">
                      {dashboardData.avgTurnaroundTime}小时
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-success-600">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm font-medium">5.2%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-danger-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-danger-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">今日安全预警</p>
                    <p className="text-xl font-bold text-danger-600">
                      {dashboardData.todayAlerts}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-danger-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">3.1%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary-500" />
                待处理预警
              </h3>
              <button
                onClick={() => navigate('/safety')}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/safety')}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={classNames(
                        'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                        alert.level === 'critical' || alert.level === 'high'
                          ? 'bg-danger-500 animate-pulse'
                          : 'bg-warning-500'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge variant={alert.type === 'speeding' ? 'danger' : 'warning'}>
                          {alert.type === 'speeding' && '超速'}
                          {alert.type === 'fatigue' && '疲劳'}
                          {alert.type === 'violation' && '违规'}
                        </StatusBadge>
                        <span className="text-xs text-neutral-500">
                          {alert.vehiclePlate}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700 line-clamp-2">
                        {alert.description}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {formatDateTime(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {recentAlerts.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-3" />
                  <p className="text-neutral-600">暂无待处理预警</p>
                  <p className="text-sm text-neutral-500 mt-1">所有预警已处理完毕</p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-neutral-800 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-500" />
              车辆状态分布
            </h3>
            <div className="space-y-4">
              {Object.entries(VEHICLE_STATUS).map(([key, val]) => {
                const count = vehicles.filter((v) => v.status === key).length;
                const percentage = Math.round((count / vehicles.length) * 100);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={classNames(
                            'w-2.5 h-2.5 rounded-full',
                            val.color === 'success' && 'bg-success-500',
                            val.color === 'warning' && 'bg-warning-500',
                            val.color === 'danger' && 'bg-danger-500',
                            val.color === 'neutral' && 'bg-neutral-500',
                            val.color === 'primary' && 'bg-primary-500'
                          )}
                        />
                        <span className="text-sm text-neutral-700">{val.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-800">{count}</span>
                        <span className="text-xs text-neutral-500">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className={classNames(
                          'h-full rounded-full transition-all duration-500',
                          val.color === 'success' && 'bg-success-500',
                          val.color === 'warning' && 'bg-warning-500',
                          val.color === 'danger' && 'bg-danger-500',
                          val.color === 'neutral' && 'bg-neutral-500',
                          val.color === 'primary' && 'bg-primary-500'
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
