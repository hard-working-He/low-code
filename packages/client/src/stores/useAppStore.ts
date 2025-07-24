import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // 导入persist中间件来保存状态

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
  
  // 暗黑模式状态
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
  syncSystemDarkMode: () => void;
}

// 检测系统暗黑模式
const getSystemDarkMode = () => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// 使用persist中间件来保存状态到localStorage
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
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
      
      // 暗黑模式状态和操作
      isDarkMode: getSystemDarkMode(), // 初始化时获取系统暗黑模式
      toggleDarkMode: () => set((state) => {
        const newDarkMode = !state.isDarkMode;
        // 应用或移除暗黑模式类名
        if (newDarkMode) {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }
        return { isDarkMode: newDarkMode };
      }),
      setDarkMode: (isDark) => set(() => {
        // 应用或移除暗黑模式类名
        if (isDark) {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }
        return { isDarkMode: isDark };
      }),
      syncSystemDarkMode: () => {
        const storageData = localStorage.getItem('app-storage');
        let isDark = getSystemDarkMode();
        
        if (storageData) {
          try {
            const parsedData = JSON.parse(storageData);
            isDark = parsedData.state.isDarkMode;
          } catch (e) {
            console.error('Failed to parse app-storage:', e);
          }
        }

        if (isDark) {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }
        set({ isDarkMode: isDark });
      },
    }),
    {
      name: 'app-storage', // 唯一的存储键名
      partialize: (state) => ({ isDarkMode: state.isDarkMode }), // 只保存isDarkMode状态
    }
  )
);

// 监听系统暗黑模式变化
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    useAppStore.getState().syncSystemDarkMode();
  });
} 