import { create } from 'zustand';
import type { HistoryRecord } from '@/utils/historyApi';

interface HistoryState {
  histories: HistoryRecord[];
  currentHistoryId: number | null;
  isLoading: boolean;
}

interface HistoryActions {
  setHistories: (histories: HistoryRecord[]) => void;
  addHistory: (history: HistoryRecord) => void;
  updateHistory: (id: number, updatedHistory: HistoryRecord) => void;
  deleteHistory: (id: number) => void;
  setCurrentHistoryId: (id: number | null) => void;
  setLoading: (loading: boolean) => void;
  clearHistories: () => void;
}

export type HistoryStore = HistoryState & HistoryActions;

export const useHistoryStore = create<HistoryStore>((set) => ({
  // 状态
  histories: [],
  currentHistoryId: null,
  isLoading: false,

  // 动作
  setHistories: (histories) => set({ histories }),
  
  addHistory: (history) => set((state) => ({
    histories: [history, ...state.histories] // 新的历史记录添加到前面
  })),
  
  updateHistory: (id, updatedHistory) => set((state) => ({
    histories: state.histories.map((history) =>
      history.id === id ? updatedHistory : history
    )
  })),
  
  deleteHistory: (id) => set((state) => ({
    histories: state.histories.filter((history) => history.id !== id),
    currentHistoryId: state.currentHistoryId === id ? null : state.currentHistoryId
  })),
  
  setCurrentHistoryId: (id) => set({ currentHistoryId: id }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  clearHistories: () => set({
    histories: [],
    currentHistoryId: null,
    isLoading: false
  })
})); 