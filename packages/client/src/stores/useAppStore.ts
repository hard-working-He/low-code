import { create } from 'zustand';

interface CanvasStyleData {
  color: string;
  opacity: number;
  backgroundColor: string;
  fontSize: number;
}

interface AppState {
  // Canvas styling
  canvasStyleData: CanvasStyleData;
  updateCanvasStyleData: (key: keyof CanvasStyleData, value: string | number) => void;
  
  // Left panel state
  leftListOpen: boolean;
  toggleLeftPanel: () => void;
  
  // Drop state
  isOver: boolean;
  setIsOver: (isOver: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Canvas styling initial state
  canvasStyleData: {
    color: '#000000',
    opacity: 100,
    backgroundColor: '#ffffff',
    fontSize: 14,
  },
  
  updateCanvasStyleData: (key, value) => 
    set((state) => ({
      canvasStyleData: {
        ...state.canvasStyleData,
        [key]: value,
      }
    })),
  
  // Left panel initial state
  leftListOpen: true,
  toggleLeftPanel: () => set((state) => ({ leftListOpen: !state.leftListOpen })),
  
  // Drop state
  isOver: false,
  setIsOver: (isOver) => set({ isOver }),
})); 