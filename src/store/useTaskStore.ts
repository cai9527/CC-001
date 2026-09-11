import { create } from 'zustand';
import type { TransportTask, TransportRecord } from '@/types';
import { mockTasks, mockTransportRecords } from '@/services/mock/data';

interface TaskState {
  tasks: TransportTask[];
  records: TransportRecord[];
  loading: boolean;
  filters: {
    search: string;
    status: string;
    dateRange: [string, string] | null;
  };
  getTasks: () => Promise<TransportTask[]>;
  getTaskById: (id: string) => TransportTask | undefined;
  addTask: (task: Omit<TransportTask, 'id' | 'createdAt' | 'completedLoads' | 'totalWeight'>) => Promise<TransportTask>;
  updateTask: (id: string, data: Partial<TransportTask>) => Promise<TransportTask>;
  updateTaskStatus: (id: string, status: TransportTask['status']) => Promise<TransportTask>;
  getTaskRecords: (taskId: string) => TransportRecord[];
  addRecord: (record: Omit<TransportRecord, 'id'>) => Promise<TransportRecord>;
  setFilters: (filters: Partial<TaskState['filters']>) => void;
  getFilteredTasks: () => TransportTask[];
  getStatistics: () => { pending: number; inProgress: number; completed: number; cancelled: number };
  deleteTask: (id: string) => Promise<boolean>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: mockTasks,
  records: mockTransportRecords,
  loading: false,
  filters: {
    search: '',
    status: '',
    dateRange: null,
  },

  getTasks: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ loading: false });
    return get().tasks;
  },

  getTaskById: (id) => {
    return get().tasks.find((t) => t.id === id);
  },

  addTask: async (taskData) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newTask: TransportTask = {
      ...taskData,
      id: 't' + Date.now(),
      completedLoads: 0,
      totalWeight: 0,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ tasks: [newTask, ...state.tasks] }));
    return newTask;
  },

  updateTask: async (id, data) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));
    return get().tasks.find((t) => t.id === id)!;
  },

  updateTaskStatus: async (id, status) => {
    const updates: Partial<TransportTask> = { status };
    if (status === 'in_progress') {
      updates.startTime = new Date().toISOString();
    } else if (status === 'completed') {
      updates.endTime = new Date().toISOString();
    }
    return get().updateTask(id, updates);
  },

  getTaskRecords: (taskId) => {
    return get().records.filter((r) => r.taskId === taskId);
  },

  addRecord: async (recordData) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newRecord: TransportRecord = {
      ...recordData,
      id: 'r' + Date.now(),
    };
    set((state) => ({ records: [newRecord, ...state.records] }));
    
    const task = get().getTaskById(recordData.taskId);
    if (task) {
      get().updateTask(recordData.taskId, {
        completedLoads: task.completedLoads + 1,
        totalWeight: task.totalWeight + recordData.weight,
      });
    }
    
    return newRecord;
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  getFilteredTasks: () => {
    const { tasks, filters } = get();
    let filtered = [...tasks];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.taskNo.toLowerCase().includes(search) ||
          t.name.toLowerCase().includes(search)
      );
    }

    if (filters.status) {
      filtered = filtered.filter((t) => t.status === filters.status);
    }

    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter((t) => {
        const taskDate = t.createdAt.split('T')[0];
        return taskDate >= start && taskDate <= end;
      });
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getStatistics: () => {
    const { tasks } = get();
    return {
      pending: tasks.filter((t) => t.status === 'pending').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      cancelled: tasks.filter((t) => t.status === 'cancelled').length,
    };
  },

  deleteTask: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
    return true;
  },
}));
