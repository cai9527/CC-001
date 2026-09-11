import { create } from 'zustand';
import type { SafetyAlert, Driver } from '@/types';
import { mockSafetyAlerts, mockDrivers } from '@/services/mock/data';

interface SafetyState {
  alerts: SafetyAlert[];
  drivers: Driver[];
  loading: boolean;
  filters: {
    status: string;
    level: string;
    type: string;
    dateRange: [string, string] | null;
  };
  getAlerts: () => Promise<SafetyAlert[]>;
  getAlertById: (id: string) => SafetyAlert | undefined;
  processAlert: (id: string, status: 'processed' | 'ignored', remark?: string) => Promise<SafetyAlert>;
  addAlert: (alert: Omit<SafetyAlert, 'id' | 'status'>) => Promise<SafetyAlert>;
  getDrivers: () => Promise<Driver[]>;
  setFilters: (filters: Partial<SafetyState['filters']>) => void;
  getFilteredAlerts: () => SafetyAlert[];
  getStatistics: () => { pending: number; processed: number; ignored: number; byLevel: Record<string, number>; byType: Record<string, number> };
  getRealTimeMonitoring: () => Array<{ vehicleId: string; plateNumber: string; driverName: string; speed: number; drivingHours: number; status: 'normal' | 'warning' | 'danger' }>;
}

export const useSafetyStore = create<SafetyState>((set, get) => ({
  alerts: mockSafetyAlerts,
  drivers: mockDrivers,
  loading: false,
  filters: {
    status: '',
    level: '',
    type: '',
    dateRange: null,
  },

  getAlerts: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ loading: false });
    return get().alerts;
  },

  getAlertById: (id) => {
    return get().alerts.find((a) => a.id === id);
  },

  processAlert: async (id, status, remark) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              remark,
              processedBy: 'admin',
              processedAt: new Date().toISOString(),
            }
          : a
      ),
    }));
    return get().alerts.find((a) => a.id === id)!;
  },

  addAlert: async (alertData) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const newAlert: SafetyAlert = {
      ...alertData,
      id: 'a' + Date.now(),
      status: 'pending',
    };
    set((state) => ({ alerts: [newAlert, ...state.alerts] }));
    return newAlert;
  },

  getDrivers: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return get().drivers;
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  getFilteredAlerts: () => {
    const { alerts, filters } = get();
    let filtered = [...alerts];

    if (filters.status) {
      filtered = filtered.filter((a) => a.status === filters.status);
    }

    if (filters.level) {
      filtered = filtered.filter((a) => a.level === filters.level);
    }

    if (filters.type) {
      filtered = filtered.filter((a) => a.type === filters.type);
    }

    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter((a) => {
        const alertDate = a.timestamp.split('T')[0];
        return alertDate >= start && alertDate <= end;
      });
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  getStatistics: () => {
    const { alerts } = get();
    const stats = {
      pending: 0,
      processed: 0,
      ignored: 0,
      byLevel: { low: 0, medium: 0, high: 0, critical: 0 } as Record<string, number>,
      byType: { speeding: 0, fatigue: 0, violation: 0, overload: 0 } as Record<string, number>,
    };

    alerts.forEach((a) => {
      stats[a.status]++;
      stats.byLevel[a.level]++;
      stats.byType[a.type]++;
    });

    return stats;
  },

  getRealTimeMonitoring: () => {
    const { alerts } = get();
    const vehicleStatuses = [
      { vehicleId: 'v001', plateNumber: '京A12345', driverName: '张三', speed: 45, drivingHours: 3.5, status: 'normal' as const },
      { vehicleId: 'v002', plateNumber: '京B67890', driverName: '李四', speed: 52, drivingHours: 2.0, status: 'normal' as const },
      { vehicleId: 'v004', plateNumber: '京D22222', driverName: '赵六', speed: 38, drivingHours: 5.5, status: 'warning' as const },
      { vehicleId: 'v005', plateNumber: '京E33333', driverName: '孙七', speed: 60, drivingHours: 4.5, status: 'danger' as const },
      { vehicleId: 'v008', plateNumber: '京H66666', driverName: '吴十', speed: 48, drivingHours: 1.5, status: 'normal' as const },
    ];

    return vehicleStatuses.map((vs) => {
      const hasAlert = alerts.some(
        (a) => a.vehicleId === vs.vehicleId && a.status === 'pending' && (a.level === 'high' || a.level === 'critical')
      );
      if (hasAlert) {
        return { ...vs, status: 'danger' as const };
      }
      if (vs.drivingHours > 4 || vs.speed > 55) {
        return { ...vs, status: 'warning' as const };
      }
      return vs;
    });
  },
}));
