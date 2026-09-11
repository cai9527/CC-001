import { create } from 'zustand';
import type { Vehicle, VehicleDocument, MaintenanceRecord } from '@/types';
import { mockVehicles } from '@/services/mock/data';
import { generateId } from '@/utils';

interface VehicleState {
  vehicles: Vehicle[];
  loading: boolean;
  filters: {
    search: string;
    status: string;
    vehicleType: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  getVehicles: () => Promise<Vehicle[]>;
  getVehicleById: (id: string) => Vehicle | undefined;
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'documents' | 'maintenanceRecords'>) => Promise<Vehicle>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<Vehicle>;
  deleteVehicle: (id: string) => Promise<boolean>;
  addDocument: (vehicleId: string, doc: Omit<VehicleDocument, 'id'>) => Promise<VehicleDocument>;
  updateDocument: (vehicleId: string, docId: string, data: Partial<VehicleDocument>) => Promise<VehicleDocument>;
  deleteDocument: (vehicleId: string, docId: string) => Promise<boolean>;
  addMaintenance: (vehicleId: string, record: Omit<MaintenanceRecord, 'id'>) => Promise<MaintenanceRecord>;
  setFilters: (filters: Partial<VehicleState['filters']>) => void;
  setPagination: (pagination: Partial<VehicleState['pagination']>) => void;
  getFilteredVehicles: () => Vehicle[];
}

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: mockVehicles,
  loading: false,
  filters: {
    search: '',
    status: '',
    vehicleType: '',
  },
  pagination: {
    page: 1,
    pageSize: 10,
    total: mockVehicles.length,
  },

  getVehicles: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ loading: false });
    return get().vehicles;
  },

  getVehicleById: (id) => {
    return get().vehicles.find((v) => v.id === id);
  },

  addVehicle: async (vehicleData) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: 'v' + Date.now(),
      documents: [],
      maintenanceRecords: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      vehicles: [...state.vehicles, newVehicle],
      pagination: { ...state.pagination, total: state.vehicles.length + 1 },
    }));
    return newVehicle;
  },

  updateVehicle: async (id, data) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === id ? { ...v, ...data, updatedAt: new Date().toISOString() } : v
      ),
    }));
    return get().vehicles.find((v) => v.id === id)!;
  },

  deleteVehicle: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    set((state) => ({
      vehicles: state.vehicles.filter((v) => v.id !== id),
      pagination: { ...state.pagination, total: state.vehicles.length - 1 },
    }));
    return true;
  },

  addDocument: async (vehicleId, docData) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newDoc: VehicleDocument = {
      ...docData,
      id: 'doc' + generateId(),
    };
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === vehicleId
          ? { ...v, documents: [...v.documents, newDoc], updatedAt: new Date().toISOString() }
          : v
      ),
    }));
    return newDoc;
  },

  updateDocument: async (vehicleId, docId, data) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              documents: v.documents.map((d) => (d.id === docId ? { ...d, ...data } : d)),
              updatedAt: new Date().toISOString(),
            }
          : v
      ),
    }));
    const vehicle = get().vehicles.find((v) => v.id === vehicleId);
    return vehicle?.documents.find((d) => d.id === docId)!;
  },

  deleteDocument: async (vehicleId, docId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              documents: v.documents.filter((d) => d.id !== docId),
              updatedAt: new Date().toISOString(),
            }
          : v
      ),
    }));
    return true;
  },

  addMaintenance: async (vehicleId, recordData) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newRecord: MaintenanceRecord = {
      ...recordData,
      id: 'm' + generateId(),
    };
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              maintenanceRecords: [...v.maintenanceRecords, newRecord],
              updatedAt: new Date().toISOString(),
            }
          : v
      ),
    }));
    return newRecord;
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters }, pagination: { ...state.pagination, page: 1 } }));
  },

  setPagination: (pagination) => {
    set((state) => ({ pagination: { ...state.pagination, ...pagination } }));
  },

  getFilteredVehicles: () => {
    const { vehicles, filters, pagination } = get();
    let filtered = [...vehicles];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.plateNumber.toLowerCase().includes(search) ||
          v.model.toLowerCase().includes(search) ||
          v.manufacturer.toLowerCase().includes(search)
      );
    }

    if (filters.status) {
      filtered = filtered.filter((v) => v.status === filters.status);
    }

    if (filters.vehicleType) {
      filtered = filtered.filter((v) => v.vehicleType === filters.vehicleType);
    }

    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;

    return filtered.slice(start, end);
  },
}));
