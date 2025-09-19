/* 用一个数组 componentData 维护编辑器中的数据。
把组件拖拽到画布中时，使用 push() 方法将新的组件数据添加到 componentData。
编辑器使用 JSX 语法结合 render() 将每个组件逐个渲染到画布 */

import { create } from 'zustand'
import { useSnapShotStore } from './useSnapShotStore';

// 组件类型定义
export interface Component {
  id: string;//唯一id
  index: number;
  type: string;
  propValue: string|object;
  component?: string;
  label?: string;
  icon?: string;
  animations?: any[];
  events?: object;
  isLock?: boolean;
  groupParentId?: string; // 组内组件的父组ID
  style: {
    top: number;
    left: number;
    width?: number;//可选
    height?: number;//可选
    rotate?: number;
    fontSize?: number;
    fontWeight?: number;
    lineHeight?: string;
    letterSpacing?: number;
    textAlign?: string;
    color?: string;
    [key: string]: any;
  };
}

// 记录快照的辅助函数，确保在状态更新后调用
// 用于控制是否记录拖拽过程中的状态变化
let isDragging = false;
let hasRecordedInitialDragState = false;

// 标记开始拖拽
export const startDrag = () => {
  isDragging = true;
  hasRecordedInitialDragState = false;
};

// 标记结束拖拽
export const endDrag = () => {
  if (isDragging) {
    // 拖拽结束时记录最终状态
    setTimeout(() => {
      try {
        useSnapShotStore.getState().recordSnapshot();
        console.log('已记录拖拽结束状态的快照');
      } catch (error) {
        console.error('Error recording drag end snapshot:', error);
      }
    }, 0);
  }
  isDragging = false;
  hasRecordedInitialDragState = false;
};

// 记录快照的辅助函数，确保在状态更新后调用
const recordSnapshotAfterUpdate = () => {
  // 如果正在拖拽中
  if (isDragging) {
    // 只记录拖拽开始的状态，忽略中间状态
    if (!hasRecordedInitialDragState) {
      hasRecordedInitialDragState = true;
      setTimeout(() => {
        try {
          useSnapShotStore.getState().recordSnapshot();
          console.log('已记录拖拽开始状态的快照');
        } catch (error) {
          console.error('Error recording drag start snapshot:', error);
        }
      }, 0);
    }
    return; // 拖拽过程中不记录其他快照
  }
  
  // 非拖拽状态下的正常快照记录
  setTimeout(() => {
    try {
      useSnapShotStore.getState().recordSnapshot();
    } catch (error) {
      console.error('Error recording snapshot:', error);
    }
  }, 0);
};

// 编辑器存储类型
interface EditorStore {
  componentData: Component[];
  addComponent: (component: Component) => void;
  updateComponentDataPropValue: (element: Component, value: string) => void;
  updateComponentPosition: (id: string, left: number, top: number, additionalStyles?: any) => void;
  updateComponent: (id: string, key: string, value: any) => void;
  clearComponentData: () => void;
  deleteComponent: (id: string) => void;
  setComponentData: (data: Component[]) => void;
  lockComponent: (id: string) => void;
  unlockComponent: (id: string) => void;
  // 拖拽状态控制函数
  startDrag: () => void;
  endDrag: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
    // 添加拖拽状态控制函数到store
    startDrag,
    endDrag,
    // 初始化空的组件数据，不再从localStorage加载
    componentData: [],
    addComponent: (component: Component) => set((state: EditorStore) => {
      const result = { componentData: [...state.componentData, component] };
      recordSnapshotAfterUpdate();
      return result;
    }),
    
    //更新propValue
    updateComponentDataPropValue: (element: Component, value: string) => set((state: EditorStore) => {
        const result = {
          componentData: state.componentData.map((item) => {
            if (item.id === element.id) {
              return { ...item, propValue: value };
            }
            return item;
          })
        };
        recordSnapshotAfterUpdate();
        return result;
      }),
      
    //更新组件位置和样式
    updateComponentPosition: (id: string, left?: number, top?: number, additionalStyles?: any) => set((state: EditorStore) => {
      console.log('Updating component position:', id, { left, top, ...additionalStyles });
      const result = {
        componentData: state.componentData.map((item) => {
          if (item.id === id) {
            return { 
              ...item, 
              style: { 
                ...item.style, 
                left: left || item.style.left, 
                top: top || item.style.top,
                ...(additionalStyles || {})
              } 
            };
          }
          return item;
        })
      };
      
      recordSnapshotAfterUpdate();
      return result;
    }),
      
    // 通用更新组件函数，可以更新任何属性包括样式
    updateComponent: (id: string, key: string, value: any) => set((state: EditorStore) => {
      const result = {
        componentData: state.componentData.map((item) => {
          if (item.id === id) {
            // 如果是更新style中的属性
            if (key.startsWith('style.')) {
              const styleKey = key.split('.')[1];
              return {
                ...item,
                style: {
                  ...item.style,
                  [styleKey]: value
                }
              };
            }
            // 直接更新组件的顶级属性
            return {
              ...item,
              [key]: value
            };
          }
          return item;
        })
      };
      recordSnapshotAfterUpdate();
      return result;
    }),
      
    //清空画布
    clearComponentData: () => set(() => {
      const result = { componentData: [] };
      recordSnapshotAfterUpdate();
      return result;
    }),
      
    //删除组件
    deleteComponent: (id: string) => set((state: EditorStore) => {
      const result = { componentData: state.componentData.filter((item) => item.id !== id) };
      recordSnapshotAfterUpdate();
      return result;
    }),
      
    //设置组件数据
    setComponentData: (data: Component[]) => {
      // 确保我们对数据进行深拷贝，避免引用问题
      const deepCopiedData = JSON.parse(JSON.stringify(data));
      const result = set(() => ({ componentData: deepCopiedData }));
      recordSnapshotAfterUpdate();
      return result;
    },
      
    //锁定组件
    lockComponent: (id: string) => set((state: EditorStore) => {
      const result = {
        componentData: state.componentData.map((item) => {
          if (item.id === id) {
            return { ...item, isLock: true };
          }
          return item;
        })
      };
      recordSnapshotAfterUpdate();
      return result;
    }),
      
    //解锁组件
    unlockComponent: (id: string) => set((state: EditorStore) => {
      const result = {
        componentData: state.componentData.map((item) => {
          if (item.id === id) {
            return { ...item, isLock: false };
          }
          return item;
        })
      };
      recordSnapshotAfterUpdate();
      return result;
    }),
}))