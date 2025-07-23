import { create } from 'zustand';
import type { Component } from './useEditorStore';
import { useEditorStore } from './useEditorStore';
import { deepCopy } from '@/utils/utils';

// Default component data storage
let defaultComponentData: Component[] = [];

// Helper function to get a copy of default component data
function getDefaultComponentData(): Component[] {
  return JSON.parse(JSON.stringify(defaultComponentData));
}

// Function to set default component data
export function setDefaultComponentData(data: Component[] = []): void {
  defaultComponentData = data;
}

// Types for the snapshot store
interface SnapShotState {
  snapshotData: Component[][];
  snapshotIndex: number;
}

interface SnapShotActions {
  undo: () => void;
  redo: () => void;
  recordSnapshot: () => void;
}

// Create the snapshot store
const useSnapShotStore = create<SnapShotState & SnapShotActions>((set) => ({
  // State
  snapshotData: [],
  snapshotIndex: -1,

  // Actions
  undo: () => {
    set((state) => {
      if (state.snapshotIndex >= 0) {
        const newIndex = state.snapshotIndex - 1;
        let componentData;
        
        if (newIndex >= 0) {
          // Make sure we have valid snapshot data
          if (!state.snapshotData[newIndex] || !Array.isArray(state.snapshotData[newIndex])) {
            console.warn('无效的快照数据，无法撤销');
            return state;
          }
          componentData = deepCopy(state.snapshotData[newIndex]); 
        } else {
          // If we're going back to initial state, use default data
          componentData = getDefaultComponentData();
        }
        
        // 确保componentData是有效数组
        if (!Array.isArray(componentData)) {
          console.warn('无效的快照数据，无法撤销');
          return state;
        }
        
        // 安全地更新组件数据
        try {
          // 使用EditorStore的setComponentData方法更新组件数据
          useEditorStore.setState({ componentData });
          
          console.log('Undo: Setting component data', componentData);
          
          return {
            snapshotIndex: newIndex
          };
        } catch (error) {
          console.error('撤销操作失败:', error);
          return state;
        }
      }
      
      return state;
    });
  },
  
  redo: () => {
    set((state) => {
      if (state.snapshotIndex < state.snapshotData.length - 1) {
        const newIndex = state.snapshotIndex + 1;
        
        // 确保快照数据存在
        if (!state.snapshotData[newIndex] || !Array.isArray(state.snapshotData[newIndex])) {
          console.warn('找不到要重做的快照数据');
          return state;
        }
        
        // 深拷贝快照数据
        const componentData = deepCopy(state.snapshotData[newIndex]);
        
        // 安全地更新组件数据
        try {
          // 使用EditorStore的setComponentData方法更新组件数据
          useEditorStore.setState({ componentData });
          
          console.log('Redo: Setting component data', componentData);
          
          return {
            snapshotIndex: newIndex
          };
        } catch (error) {
          console.error('重做操作失败:', error);
          return state;
        }
      }
      
      return state;
    });
  },
  
  recordSnapshot: () => {
    set((state) => {
      // 从EditorStore获取当前组件数据
      const currentComponents = useEditorStore.getState().componentData;
      
      // 如果没有组件数据，不记录快照
      if (!currentComponents || currentComponents.length === 0) {
        console.log('No component data to record snapshot');
        return state;
      }
      
      try {
        // 创建组件数据的深拷贝
        const copyData = deepCopy(currentComponents);
        
        console.log('Recording snapshot with data:', copyData);
        
        // 创建更新的快照数据
        const newIndex = state.snapshotIndex + 1;
        
        // 删除当前索引之后的所有快照
        let newSnapshotData;
        if (newIndex > 0 && newIndex < state.snapshotData.length) {
          // 有现有快照需要截断
          newSnapshotData = [...state.snapshotData.slice(0, newIndex), copyData];
        } else {
          // 在末尾添加新快照
          newSnapshotData = [...state.snapshotData, copyData];
        }
        
        console.log('新的快照数据:', newSnapshotData, '新索引:', newIndex);
        
        return {
          snapshotIndex: newIndex,
          snapshotData: newSnapshotData
        };
      } catch (error) {
        console.error('记录快照失败:', error);
        return state;
      }
    });
  }
}));

export { useSnapShotStore };
export default useSnapShotStore;
