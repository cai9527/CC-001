import { create } from 'zustand';
import type { Driver } from '@/types';
import { mockDrivers } from '@/services/mock/data';

interface DriverState {
  drivers: Driver[];
  loading: boolean;
  filters: {
    search: string;
    status: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  getDrivers: () => Promise<Driver[]>;
  getDriverById: (id: string) => Driver | undefined;
  addDriver: (driver: Omit<Driver, 'id' | 'totalTrips' | 'totalDistance' | 'totalWeight' | 'violationCount'>) => Promise<Driver>;
  updateDriver: (id: string, data: Partial<Driver>) => Promise<Driver>;
  deleteDriver: (id: string) => Promise<boolean>;
  setFilters: (filters: Partial<DriverState['filters']>) => void;
  setPagination: (pagination: Partial<DriverState['pagination']>) => void;
  getFilteredDrivers: () => Driver[];
  getStatistics: () => { onDuty: number; offDuty: number; rest: number; violation: number };
}

export const useDriverStore = create<DriverState>((set, get) => ({
  drivers: mockDrivers,
  loading: false,
  filters: {
    search: '',
    status: '',
  },
  pagination: {
    page: 1,
    pageSize: 10,
    total: mockDrivers.length,
  },

  getDrivers: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ loading: false });
    return get().drivers;
  },

  getDriverById: (id) => {
    return get().drivers.find((d) => d.id === id);
  },

  addDriver: async (driverData) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newDriver: Driver = {
      ...driverData,
      id: 'd' + Date.now(),
      totalTrips: 0,
      totalDistance: 0,
      totalWeight: 0,
      violationCount: 0,
    };
    set((state) => ({
      drivers: [...state.drivers, newDriver],
      pagination: { ...state.pagination, total: state.drivers.length + 1 },
    }));
    return newDriver;
  },

  updateDriver: async (id, data) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    set((state) => ({
      drivers: state.drivers.map((d) => (d.id === id ? { ...d, ...data } : d)),
    }));
    return get().drivers.find((d) => d.id === id)!;
  },

  deleteDriver: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    set((state) => ({
      drivers: state.drivers.filter((d) => d.id !== id),
      pagination: { ...state.pagination, total: state.drivers.length - 1 },
    }));
    return true;
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters }, pagination: { ...state.pagination, page: 1 } }));
  },

  setPagination: (pagination) => {
    set((state) => ({ pagination: { ...state.pagination, ...pagination } }));
  },

  getFilteredDrivers: () => {
    const { drivers, filters, pagination } = get();
    let filtered = [...drivers];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(search) ||
          d.phone.includes(search) ||
          d.licenseNumber.toLowerCase().includes(search)
      );
    }

    if (filters.status) {
      filtered = filtered.filter((d) => d.status === filters.status);
    }

    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;

    return filtered.slice(start, end);
  },

  getStatistics: () => {
    const { drivers } = get();
    return {
      onDuty: drivers.filter((d) => d.status === 'on_duty').length,
      offDuty: drivers.filter((d) => d.status === 'off_duty').length,
      rest: drivers.filter((d) => d.status === 'rest').length,
      violation: drivers.filter((d) => d.status === 'violation').length,
    };
  },
}));
