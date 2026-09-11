import { useState } from 'react';
import { BarChart3, Truck, Calendar, Download, TrendingUp, BarChart2, PieChart } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useStatisticsStore } from '@/store/useStatisticsStore';
import StatCard from '@/components/Charts/StatCard';
import { Card } from '@/components/UI/Card';
import { formatWeight, formatNumber, exportToCSV } from '@/utils';

const COLORS = ['#165DFF', '#36D399', '#FBBD23', '#F87272', '#8B5CF6', '#F472B6'];

export default function StatisticsPage() {
  const { dashboardData, dailyStats, monthlyStats, vehicleStats, driverStats } = useStatisticsStore();
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'vehicle' | 'driver'>('daily');

  const handleExportDaily = () => {
    exportToCSV(dailyStats, '运输量日统计');
  };

  const handleExportMonthly = () => {
    exportToCSV(monthlyStats, '运输量月统计');
  };

  const materialDistribution = [
    { name: '土石方', value: 4500, color: '#165DFF' },
    { name: '建筑垃圾', value: 3200, color: '#36D399' },
    { name: '砂石料', value: 2800, color: '#FBBD23' },
    { name: '水泥', value: 1500, color: '#F87272' },
    { name: '其他', value: 800, color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">运输统计</h1>
          <p className="text-sm text-neutral-500 mt-1">多维度统计运输量数据，可视化展示运营情况</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={activeTab === 'daily' ? handleExportDaily : handleExportMonthly}
            className="btn btn-default flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="今日运输量"
          value={formatWeight(dashboardData.todayTransportVolume)}
          unit="吨"
          icon={<Truck className="w-6 h-6" />}
          trend={{ value: 12.5, direction: 'up' }}
          color="primary"
        />
        <StatCard
          title="今日运输趟次"
          value={formatNumber(dashboardData.todayTrips)}
          unit="趟"
          icon={<BarChart2 className="w-6 h-6" />}
          trend={{ value: 8.3, direction: 'up' }}
          color="success"
        />
        <StatCard
          title="本月运输量"
          value={formatWeight(dashboardData.monthTransportVolume)}
          unit="吨"
          icon={<Calendar className="w-6 h-6" />}
          trend={{ value: 15.2, direction: 'up' }}
          color="warning"
        />
        <StatCard
          title="累计运输量"
          value={formatWeight(dashboardData.totalTransportVolume)}
          unit="吨"
          icon={<BarChart3 className="w-6 h-6" />}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                运输量趋势
              </h3>
              <div className="flex bg-neutral-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('daily')}
                  className={activeTab === 'daily' ? 'tab-active' : 'tab-inactive'}
                >
                  日
                </button>
                <button
                  onClick={() => setActiveTab('monthly')}
                  className={activeTab === 'monthly' ? 'tab-active' : 'tab-inactive'}
                >
                  月
                </button>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === 'daily' ? (
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      formatter={(value: number) => [`${formatWeight(value)}`, '运输量']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="totalWeight" fill="#165DFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      formatter={(value: number) => [`${formatWeight(value)}`, '运输量']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalWeight"
                      stroke="#165DFF"
                      strokeWidth={3}
                      dot={{ fill: '#165DFF', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary-500" />
                车辆运输排行
              </h3>
              <select className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                <option>本月</option>
                <option>上月</option>
                <option>本季度</option>
              </select>
            </div>
            <div className="space-y-3">
              {vehicleStats.slice(0, 5).map((vehicle, index) => (
                <div key={vehicle.vehicleId} className="flex items-center gap-4">
                  <div
                    className={
                      index === 0
                        ? 'w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-sm'
                        : index === 1
                        ? 'w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white font-bold text-sm'
                        : index === 2
                        ? 'w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm'
                        : 'w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-bold text-sm'
                    }
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-neutral-800">{vehicle.plateNumber}</span>
                      <span className="text-sm text-primary-600 font-medium">
                        {formatWeight(vehicle.totalWeight)}
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                        style={{
                          width: `${(vehicle.totalWeight / vehicleStats[0].totalWeight) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-neutral-500">
                      <span>{vehicle.trips}趟</span>
                      <span>
                        完成率: {vehicle.completionRate}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-neutral-800 flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-primary-500" />
              物料运输分布
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={materialDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {materialDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${formatWeight(value)}`, '运输量']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {materialDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-neutral-600">{item.name}</span>
                  <span className="text-sm font-medium text-neutral-800 ml-auto">
                    {Math.round((item.value / materialDistribution.reduce((a, b) => a + b.value, 0)) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-neutral-800 flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-success-500" />
              驾驶员绩效排行
            </h3>
            <div className="space-y-4">
              {driverStats().slice(0, 5).map((driver, index) => (
                <div key={driver.driverId} className="flex items-center gap-3">
                  <div
                    className={
                      index === 0
                        ? 'w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0'
                        : index === 1
                        ? 'w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0'
                        : index === 2
                        ? 'w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0'
                        : 'w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-bold text-sm flex-shrink-0'
                    }
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-neutral-800 truncate">{driver.driverName}</span>
                      <span className="text-sm text-success-600 font-medium ml-2">
                        {formatWeight(driver.totalWeight)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                      <span>{driver.trips}趟</span>
                      <span>•</span>
                      <span>{driver.workHours}小时</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-neutral-800 mb-6">详细数据</h3>
        <div className="flex bg-neutral-100 rounded-lg p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab('daily')}
            className={activeTab === 'daily' ? 'tab-active' : 'tab-inactive'}
          >
            日统计
          </button>
          <button
            onClick={() => setActiveTab('vehicle')}
            className={activeTab === 'vehicle' ? 'tab-active' : 'tab-inactive'}
          >
            车辆统计
          </button>
          <button
            onClick={() => setActiveTab('driver')}
            className={activeTab === 'driver' ? 'tab-active' : 'tab-inactive'}
          >
            驾驶员统计
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'daily' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">日期</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">运输趟次</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">运输量(吨)</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">平均载重(吨)</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">周转量(吨公里)</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">油耗(升)</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.map((stat) => (
                  <tr key={stat.date} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4 font-medium text-neutral-800">{stat.date}</td>
                    <td className="py-3 px-4">{stat.trips}</td>
                    <td className="py-3 px-4 font-medium text-primary-600">{formatWeight(stat.totalWeight)}</td>
                    <td className="py-3 px-4">{formatNumber(stat.avgWeight)}</td>
                    <td className="py-3 px-4">{formatNumber(stat.turnover)}</td>
                    <td className="py-3 px-4">{formatNumber(stat.fuelConsumption)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'vehicle' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">车牌号</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">驾驶员</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">运输趟次</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">运输量(吨)</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">周转量(吨公里)</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">油耗(升)</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">完成率</th>
                </tr>
              </thead>
              <tbody>
                {vehicleStats.map((stat) => (
                  <tr key={stat.vehicleId} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4 font-medium text-primary-600">{stat.plateNumber}</td>
                    <td className="py-3 px-4">{stat.driverName}</td>
                    <td className="py-3 px-4">{stat.trips}</td>
                    <td className="py-3 px-4 font-medium text-primary-600">{formatWeight(stat.totalWeight)}</td>
                    <td className="py-3 px-4">{formatNumber(stat.turnover)}</td>
                    <td className="py-3 px-4">{formatNumber(stat.fuelConsumption)}</td>
                    <td className="py-3 px-4">
                      <span className="text-success-600 font-medium">{stat.completionRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'driver' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">驾驶员</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">所属车辆</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">运输趟次</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">运输量(吨)</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">工作时长(小时)</th>
                  <th className="text-left py-3 px-4 text-neutral-600 font-medium">安全评分</th>
                </tr>
              </thead>
              <tbody>
                {driverStats().map((stat) => (
                  <tr key={stat.driverId} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4 font-medium text-neutral-800">{stat.driverName}</td>
                    <td className="py-3 px-4">{stat.vehiclePlate}</td>
                    <td className="py-3 px-4">{stat.trips}</td>
                    <td className="py-3 px-4 font-medium text-primary-600">{formatWeight(stat.totalWeight)}</td>
                    <td className="py-3 px-4">{stat.workHours}</td>
                    <td className="py-3 px-4">
                      <span className="text-success-600 font-medium">{stat.safetyScore}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
