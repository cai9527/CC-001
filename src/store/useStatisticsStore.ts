import { create } from 'zustand';
import type { DailyStatistics, MonthlyStatistics, VehicleStatistics, DriverPerformance, DashboardData, BackupRecord, OperationLog } from '@/types';
import { mockDailyStatistics, mockMonthlyStatistics, mockVehicleStatistics, mockDriverPerformance, mockDashboardData, mockBackupRecords, mockOperationLogs } from '@/services/mock/data';

interface StatisticsState {
  dashboardData: DashboardData | null;
  dailyStats: DailyStatistics[];
  monthlyStats: MonthlyStatistics[];
  vehicleStats: VehicleStatistics[];
  driverPerformance: DriverPerformance[];
  backupRecords: BackupRecord[];
  operationLogs: OperationLog[];
  loading: boolean;
  getDashboardData: () => Promise<DashboardData>;
  getDailyStatistics: (days?: number) => Promise<DailyStatistics[]>;
  getMonthlyStatistics: () => Promise<MonthlyStatistics[]>;
  getVehicleStatistics: () => Promise<VehicleStatistics[]>;
  getDriverPerformance: () => Promise<DriverPerformance[]>;
  getBackupRecords: () => Promise<BackupRecord[]>;
  createBackup: () => Promise<BackupRecord>;
  restoreBackup: (id: string) => Promise<boolean>;
  getOperationLogs: () => Promise<OperationLog[]>;
  addOperationLog: (log: Omit<OperationLog, 'id' | 'createdAt'>) => Promise<OperationLog>;
  driverStats: () => DriverPerformance[];
  backupData: () => Promise<BackupRecord>;
  restoreData: (id: string) => Promise<boolean>;
}

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  dashboardData: mockDashboardData,
  dailyStats: mockDailyStatistics,
  monthlyStats: mockMonthlyStatistics,
  vehicleStats: mockVehicleStatistics,
  driverPerformance: mockDriverPerformance,
  backupRecords: mockBackupRecords,
  operationLogs: mockOperationLogs,
  loading: false,

  getDashboardData: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ loading: false });
    return get().dashboardData!;
  },

  getDailyStatistics: async (days = 30) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));
    set({ loading: false });
    return get().dailyStats.slice(-days);
  },

  getMonthlyStatistics: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));
    set({ loading: false });
    return get().monthlyStats;
  },

  getVehicleStatistics: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));
    set({ loading: false });
    return get().vehicleStats;
  },

  getDriverPerformance: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));
    set({ loading: false });
    return get().driverPerformance;
  },

  getBackupRecords: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));
    set({ loading: false });
    return get().backupRecords;
  },

  createBackup: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const now = new Date();
    const name = `backup_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const newBackup: BackupRecord = {
      id: 'b' + Date.now(),
      name,
      type: 'manual',
      size: 256 + Math.floor(Math.random() * 10),
      status: 'completed',
      createdAt: now.toISOString(),
      remark: '手动备份',
    };
    set((state) => ({
      backupRecords: [newBackup, ...state.backupRecords],
      loading: false,
    }));
    return newBackup;
  },

  restoreBackup: async (id) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    set({ loading: false });
    return true;
  },

  getOperationLogs: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));
    set({ loading: false });
    return get().operationLogs;
  },

  addOperationLog: async (logData) => {
    const newLog: OperationLog = {
      ...logData,
      id: 'log' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ operationLogs: [newLog, ...state.operationLogs] }));
    return newLog;
  },

  driverStats: () => {
    return get().driverPerformance;
  },

  backupData: async () => {
    return get().createBackup();
  },

  restoreData: async (id) => {
    return get().restoreBackup(id);
  },
}));
