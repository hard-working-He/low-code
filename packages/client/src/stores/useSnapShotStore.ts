import { create } from 'zustand';
import type { Component } from './useEditorStore';
import { useEditorStore } from './useEditorStore';
import { deepCopy } from '@/utils/utils';

// Operation types as string constants instead of enum
export const DiffType = {
  ADD: 'add',
  DELETE: 'delete',
  MODIFY: 'modify'
} as const;

export type DiffTypeValue = typeof DiffType[keyof typeof DiffType];

// Base interface for all diff operations
interface BaseDiffOperation {
  componentId: string;
  type: DiffTypeValue;
}

// Interface for adding a component
interface AddOperation extends BaseDiffOperation {
  type: typeof DiffType.ADD;
  data: Component; // Full component data
  index: number; // Position in the array
}

// Interface for deleting a component
interface DeleteOperation extends BaseDiffOperation {
  type: typeof DiffType.DELETE;
  index: number; // Original position for restore
  data: Component; // Saved component for undo
}

// Interface for modifying a component
interface ModifyOperation extends BaseDiffOperation {
  type: typeof DiffType.MODIFY;
  data: {
    // 完全移除单值字段
    // key: string; // Property path (e.g. 'style.width' or 'propValue')
    // oldValue: any; // Previous value
    // newValue: any; // New value
    // 只使用多值字段
    keys: string[]; // 多个属性路径
    oldValues: any[]; // 多个旧值
    newValues: any[]; // 多个新值
  };
}

// Union type for all operations
export type DiffOperation = AddOperation | DeleteOperation | ModifyOperation;

// Default component data storage
let defaultComponentData: Component[] = [];
// Component ID to Component mapping for efficient lookups
let componentMap = new Map<string, Component>();

// Helper function to get a copy of default component data
function getDefaultComponentData(): Component[] {
  return JSON.parse(JSON.stringify(defaultComponentData));
}

// Function to set default component data and initialize component map
export function setDefaultComponentData(data: Component[] = []): void {
  defaultComponentData = data;
  
  // Initialize component map
  componentMap.clear();
  data.forEach(component => {
    componentMap.set(component.id, deepCopy(component));
  });
}

// Helper function to apply a diff operation
function applyDiff(componentData: Component[], diff: DiffOperation): Component[] {
  const result = [...componentData];

  switch (diff.type) {
    case DiffType.ADD:
      // Add component at specific index
      result.splice((diff as AddOperation).index, 0, deepCopy((diff as AddOperation).data));
      // Update component map
      componentMap.set(diff.componentId, deepCopy((diff as AddOperation).data));
      break;
    
    case DiffType.DELETE:
      // Remove component at index
      result.splice((diff as DeleteOperation).index, 1);
      // Remove from component map
      componentMap.delete(diff.componentId);
      break;
    
    case DiffType.MODIFY:
      // Find component to modify
      const modifyOp = diff as ModifyOperation;
      const componentIndex = result.findIndex(comp => comp.id === diff.componentId);
      
      if (componentIndex !== -1) {
        let component = result[componentIndex];
        
        // 使用多个keys和values一次性应用所有变更
        const { keys, newValues } = modifyOp.data;
        
        // 创建一个新的组件对象来应用所有更改
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const newValue = newValues[i];
          
          // 处理嵌套属性路径 (例如 'style.width')
        if (key.includes('.')) {
          const [objKey, propKey] = key.split('.');
            // 更新组件的嵌套属性
            component = {
            ...component,
            [objKey]: {
              ...(component as any)[objKey],
              [propKey]: newValue
            }
          };
        } else {
            // 直接更新顶层属性
            component = {
            ...component,
            [key]: newValue
          };
        }
        }
        
        // 将修改后的组件放回结果数组
        result[componentIndex] = component;

        // 更新组件映射
        componentMap.set(diff.componentId, deepCopy(result[componentIndex]));
      }
      break;
  }

  return result;
}

// Helper function to revert a diff operation
function revertDiff(componentData: Component[], diff: DiffOperation): Component[] {
  const result = [...componentData];

  switch (diff.type) {
    case DiffType.ADD:
      // For add, reverting means deleting
      const addIndex = result.findIndex(comp => comp.id === diff.componentId);
      if (addIndex !== -1) {
        result.splice(addIndex, 1);
        // Remove from component map
        componentMap.delete(diff.componentId);
      }
      break;
    
    case DiffType.DELETE:
      // For delete, reverting means adding back at the original index
      const deleteOp = diff as DeleteOperation;
      result.splice(deleteOp.index, 0, deepCopy(deleteOp.data));
      // Update component map
      componentMap.set(diff.componentId, deepCopy(deleteOp.data));
      break;
    
    case DiffType.MODIFY:
      // For modify, reverting means setting back the old value
      const modifyOp = diff as ModifyOperation;
      const componentIndex = result.findIndex(comp => comp.id === diff.componentId);
      
      if (componentIndex !== -1) {
        let component = result[componentIndex];
        
        // 使用多个keys和oldValues一次性撤销所有变更
        const { keys, oldValues } = modifyOp.data;
        
        // 创建一个新的组件对象来应用所有撤销更改
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const oldValue = oldValues[i];
          
          // 处理嵌套属性路径 (例如 'style.width')
        if (key.includes('.')) {
          const [objKey, propKey] = key.split('.');
            // 更新组件的嵌套属性为旧值
            component = {
            ...component,
            [objKey]: {
              ...(component as any)[objKey],
              [propKey]: oldValue
            }
          };
        } else {
            // 直接更新顶层属性为旧值
            component = {
            ...component,
            [key]: oldValue
          };
          }
        }
        
        // 将修改后的组件放回结果数组
        result[componentIndex] = component;

        // Update component map
        componentMap.set(diff.componentId, deepCopy(result[componentIndex]));
      }
      break;
  }

  return result;
}

// Function to compare components and generate diff operations
function generateDiffs(oldComponents: Component[], newComponents: Component[]): DiffOperation[] {
  const diffs: DiffOperation[] = [];
  
  // Map old components by id for easier lookup
  const oldComponentsMap = new Map<string, { component: Component, index: number }>();
  oldComponents.forEach((component, index) => {
    oldComponentsMap.set(component.id, { component: deepCopy(component), index });
  });
  
  // Map new components by id for easier lookup
  const newComponentsMap = new Map<string, { component: Component, index: number }>();
  newComponents.forEach((component, index) => {
    newComponentsMap.set(component.id, { component: deepCopy(component), index });
  });
  
  // Find deleted components (in old but not in new)
  oldComponents.forEach((component, index) => {
    if (!newComponentsMap.has(component.id)) {
      diffs.push({
        componentId: component.id,
        type: DiffType.DELETE,
        index,
        data: deepCopy(component)
      } as DeleteOperation);
    }
  });
  
  // Find added components (in new but not in old)
  newComponents.forEach((component, index) => {
    if (!oldComponentsMap.has(component.id)) {
      diffs.push({
        componentId: component.id,
        type: DiffType.ADD,
        index,
        data: deepCopy(component)
      } as AddOperation);
    }
  });
  
  // Find modified components
  newComponents.forEach((newComponent) => {
    const oldEntry = oldComponentsMap.get(newComponent.id);
    if (oldEntry) {
      const oldComponent = oldEntry.component;
      
      // 为了调试，记录比较的组件
      console.log(`Comparing component ${newComponent.id} of type ${newComponent.type}`);
      
      // Compare properties excluding 'id'
      // First, check for top-level property changes
      const topLevelKeys = new Set([
        ...Object.keys(oldComponent),
        ...Object.keys(newComponent)
      ].filter(key => key !== 'id'));
      
      for (const key of topLevelKeys) {
        // Skip style object for now - we'll handle it separately
        if (key === 'style') continue;
        
        const oldValue = (oldComponent as any)[key];
        const newValue = (newComponent as any)[key];
        
        // 特殊处理type属性，确保在拖拽操作中不会意外修改
        if (key === 'type' && oldValue !== newValue) {
          console.warn(`Type change detected for component ${newComponent.id}: ${oldValue} -> ${newValue}`);
          
          // 只有在确实有类型修改操作时才记录差异，而不是拖拽时
          if (oldComponent.type !== newComponent.type) {
          diffs.push({
            componentId: newComponent.id,
            type: DiffType.MODIFY,
            data: {
                keys: [key],
                oldValues: [deepCopy(oldValue)],
                newValues: [deepCopy(newValue)]
              }
            } as ModifyOperation);
          }
          continue; // 跳过后续处理
        }
        
        // 使用更严格的比较方式，避免误报
        const oldValueStr = JSON.stringify(oldValue);
        const newValueStr = JSON.stringify(newValue);
        
        // 找到单个属性修改的diff创建部分
          if (oldValueStr !== newValueStr) {
            console.log(`Detected change in ${key} for component ${newComponent.id}:`, 
                       { old: oldValue, new: newValue });
            
            diffs.push({
              componentId: newComponent.id,
              type: DiffType.MODIFY,
              data: {
                keys: [key], // 使用数组形式
                oldValues: [deepCopy(oldValue)], // 使用数组形式
                newValues: [deepCopy(newValue)] // 使用数组形式
            }
          } as ModifyOperation);
        }
      }
      
      // 使用映射收集样式变更，为每个组件创建一个条目
      const styleChangesMap = new Map<string, { 
        keys: string[], 
        oldValues: any[], 
        newValues: any[] 
      }>();
      
      // Check for style property changes
      if (oldComponent.style && newComponent.style) {
        const styleKeys = new Set([
          ...Object.keys(oldComponent.style),
          ...Object.keys(newComponent.style)
        ]);
        
        // 初始化此组件的样式变更收集器
        if (!styleChangesMap.has(newComponent.id)) {
          styleChangesMap.set(newComponent.id, {
            keys: [],
            oldValues: [],
            newValues: []
          });
        }
        
        // 获取此组件的变更收集器
        const changes = styleChangesMap.get(newComponent.id)!;
        
        // 收集所有样式变更
        for (const styleKey of styleKeys) {
          const oldStyleValue = oldComponent.style[styleKey];
          const newStyleValue = newComponent.style[styleKey];
          
          // 忽略小于0.1的数值变化，避免浮点数精度问题
          if (typeof oldStyleValue === 'number' && typeof newStyleValue === 'number') {
            if (Math.abs(oldStyleValue - newStyleValue) < 0.1) {
              continue;
            }
          }
          
          if (JSON.stringify(oldStyleValue) !== JSON.stringify(newStyleValue)) {
            console.log(`Detected style change in ${styleKey} for component ${newComponent.id}:`, 
                       { old: oldStyleValue, new: newStyleValue });
            
            // 添加到样式变更集合中
            changes.keys.push(`style.${styleKey}`);
            changes.oldValues.push(deepCopy(oldStyleValue));
            changes.newValues.push(deepCopy(newStyleValue));
          }
        }
        
        // 如果有样式变更，创建一个合并的diff操作
        if (changes.keys.length > 0) {
          // 无论多少变更都使用批量格式
            diffs.push({
              componentId: newComponent.id,
              type: DiffType.MODIFY,
              data: {
              keys: changes.keys,
              oldValues: changes.oldValues,
              newValues: changes.newValues
              }
            } as ModifyOperation);
        }
      }
    }
  });
  
  console.log('Generated diffs:', diffs);
  return diffs;
}

// Types for the snapshot store
interface SnapShotState {
  snapshots: DiffOperation[][]; // Array of arrays of diff operations
  snapshotIndex: number;
  isRecording: boolean;
  // 向后兼容旧代码中的snapshotData属性
  get snapshotData(): DiffOperation[][];
}

interface SnapShotActions {
  undo: () => void;
  redo: () => void;
  recordSnapshot: () => void;
}

// Create the snapshot store
const useSnapShotStore = create<SnapShotState & SnapShotActions>((set, get) => ({
  // State
  snapshots: [],
  snapshotIndex: -1,
  isRecording: false,
  // 添加getter，兼容旧代码中可能使用的snapshotData属性
  get snapshotData() {
    return get().snapshots;
  },

  // Actions
  undo: () => {
    set((state) => {
      if (state.snapshotIndex >= 0) {
        // Get the current snapshot to revert
        const currentSnapshot = state.snapshots[state.snapshotIndex];
        const newIndex = state.snapshotIndex - 1;
        
        // Get current component data
        let componentData = useEditorStore.getState().componentData;
        
        // Apply the reverse of all operations in the current snapshot
        for (let i = currentSnapshot.length - 1; i >= 0; i--) {
          componentData = revertDiff(componentData, currentSnapshot[i]);
        }
        
        // Update editor store
        useEditorStore.setState({ componentData });
        
        console.log('Undo: Reverted to snapshot', newIndex);
        
        return {
          snapshotIndex: newIndex
        };
      }
      
      return state;
    });
  },
  
  redo: () => {
    set((state) => {
      if (state.snapshotIndex < state.snapshots.length - 1) {
        const newIndex = state.snapshotIndex + 1;
        const snapshotToApply = state.snapshots[newIndex];
        
        // Get current component data
        let componentData = useEditorStore.getState().componentData;
        
        // Apply all operations in the next snapshot
        for (const operation of snapshotToApply) {
          componentData = applyDiff(componentData, operation);
        }
        
        // Update editor store
        useEditorStore.setState({ componentData });
        
        console.log('Redo: Applied snapshot', newIndex);
        
        return {
          snapshotIndex: newIndex
        };
      }
      
      return state;
    });
  },
  
  recordSnapshot: () => {
    set((state) => {
      // Prevent recursive calls
      if (state.isRecording) {
        return state;
      }
      
      // Get current component data
      const currentComponents = useEditorStore.getState().componentData;
      
      // 记录当前所有组件的ID和类型，方便调试
      console.log('Current components:', currentComponents.map(c => ({ id: c.id, type: c.type })));
      
      // If this is the first snapshot, initialize the component map
      if (state.snapshotIndex === -1 && state.snapshots.length === 0) {
        componentMap.clear();
        currentComponents.forEach(component => {
          componentMap.set(component.id, deepCopy(component));
        });
      }
      
      try {
        // Set recording flag
        state.isRecording = true;
        
        // Get previous components (either from the last snapshot or default)
        let previousComponents: Component[];
        if (state.snapshotIndex >= 0) {
          // We need to reconstruct the previous state by applying all diffs up to the current index
          previousComponents = [...getDefaultComponentData()];
          for (let i = 0; i <= state.snapshotIndex; i++) {
            for (const operation of state.snapshots[i]) {
              previousComponents = applyDiff(previousComponents, operation);
            }
          }
        } else {
          previousComponents = getDefaultComponentData();
        }
        
        // 记录重建的上一状态中的组件ID和类型，方便调试
        console.log('Previous components:', previousComponents.map(c => ({ id: c.id, type: c.type })));
        
        // Generate diffs between previous and current state
        const diffs = generateDiffs(previousComponents, currentComponents);
        
        // 过滤掉可能的错误修改，如拖拽时不应该有类型变化
        const filteredDiffs = diffs.filter(diff => {
          // 如果是修改操作，检查是否有不应该在拖拽时发生的改变
          if (diff.type === DiffType.MODIFY) {
            const modifyOp = diff as ModifyOperation;
            // 如果修改包含类型变更，这在拖拽时不应该发生
            const typeKeyIndex = modifyOp.data.keys.findIndex(k => k === 'type');
            if (typeKeyIndex !== -1) {
              console.warn(`Filtered out unexpected type change for component ${diff.componentId}`);
              return false;
            }
          }
          return true;
        });
        
        // If there are no diffs, don't create a new snapshot
        if (filteredDiffs.length === 0) {
          console.log('No changes detected, not creating snapshot');
          return { ...state, isRecording: false };
        }
        
        console.log('Recording snapshot with filtered diffs:', filteredDiffs);
        
        // Create updated snapshots array
        const newIndex = state.snapshotIndex + 1;
        let newSnapshots;
        
        if (newIndex > 0 && newIndex < state.snapshots.length) {
          // Truncate snapshots after current index
          newSnapshots = [...state.snapshots.slice(0, newIndex), filteredDiffs];
        } else {
          // Add new snapshot at the end
          newSnapshots = [...state.snapshots, filteredDiffs];
        }
        
        console.log('New snapshots array:', newSnapshots, 'New index:', newIndex);
        
        return {
          snapshotIndex: newIndex,
          snapshots: newSnapshots,
          isRecording: false
        };
      } catch (error) {
        console.error('Failed to record snapshot:', error);
        return { ...state, isRecording: false };
      }
    });
  }
}));

export { useSnapShotStore };
export default useSnapShotStore;
