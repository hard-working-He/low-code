import { create } from 'zustand';
import type { Component } from './useEditorStore';
import { DiffType } from './useSnapShotStore.types';
import type {
  AddOperation,
  DeleteOperation,
  ModifyOperation,
  DiffOperation,
  SnapShotState,
  SnapShotActions
} from './useSnapShotStore.types';
import { useEditorStore } from './useEditorStore';
import { deepCopy } from '@/utils/utils';

// 所有差异操作的基础接口
// 添加组件的操作接口
// 删除组件的操作接口
// 修改组件的操作接口
// 所有操作的联合类型
// 默认组件数据存储
let defaultComponentData: Component[] = [];
// 组件ID到组件的映射，便于高效查找
let componentMap = new Map<string, Component>();

// 获取默认组件数据的副本
function getDefaultComponentData(): Component[] {
  return JSON.parse(JSON.stringify(defaultComponentData));
}

// 设置默认组件数据并初始化组件映射
export function setDefaultComponentData(data: Component[] = []): void {
  defaultComponentData = data;
  
  // 初始化组件映射
  componentMap.clear();
  data.forEach(component => {
    componentMap.set(component.id, deepCopy(component));
  });
}

// 应用差异操作的辅助函数
function applyDiff(componentData: Component[], diff: DiffOperation): Component[] {
  const result = [...componentData];

  switch (diff.type) {
    case DiffType.ADD:
      // 在指定索引添加组件
      result.splice((diff as AddOperation).index, 0, deepCopy((diff as AddOperation).data));
      // 更新组件映射
      componentMap.set(diff.componentId, deepCopy((diff as AddOperation).data));
      break;
    
    case DiffType.DELETE:
      // 在索引处移除组件
      result.splice((diff as DeleteOperation).index, 1);
      // 从组件映射中移除
      componentMap.delete(diff.componentId);
      break;
    
    case DiffType.MODIFY:
      // 查找要修改的组件
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

// 撤销差异操作的辅助函数
function revertDiff(componentData: Component[], diff: DiffOperation): Component[] {
  const result = [...componentData];

  switch (diff.type) {
    case DiffType.ADD:
      // 对于添加，撤销即为删除
      const addIndex = result.findIndex(comp => comp.id === diff.componentId);
      if (addIndex !== -1) {
        result.splice(addIndex, 1);
        // 从组件映射中移除
        componentMap.delete(diff.componentId);
      }
      break;
    
    case DiffType.DELETE:
      // 对于删除，撤销即为在原始索引处添加回来
      const deleteOp = diff as DeleteOperation;
      result.splice(deleteOp.index, 0, deepCopy(deleteOp.data));
      // 更新组件映射
      componentMap.set(diff.componentId, deepCopy(deleteOp.data));
      break;
    
    case DiffType.MODIFY:
      // 对于修改，撤销即为还原旧值
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

        // 更新组件映射
        componentMap.set(diff.componentId, deepCopy(result[componentIndex]));
      }
      break;
  }

  return result;
}

// 比较组件并生成差异操作
function generateDiffs(oldComponents: Component[], newComponents: Component[]): DiffOperation[] {
  const diffs: DiffOperation[] = [];
  
  // 通过id将旧组件映射，便于查找
  const oldComponentsMap = new Map<string, { component: Component, index: number }>();
  oldComponents.forEach((component, index) => {
    oldComponentsMap.set(component.id, { component: deepCopy(component), index });
  });
  
  // 通过id将新组件映射，便于查找
  const newComponentsMap = new Map<string, { component: Component, index: number }>();
  newComponents.forEach((component, index) => {
    newComponentsMap.set(component.id, { component: deepCopy(component), index });
  });
  
  // 查找被删除的组件（在旧组件中但不在新组件中）
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
  
  // 查找被添加的组件（在新组件中但不在旧组件中）
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
  
  // 查找被修改的组件
  newComponents.forEach((newComponent) => {
    const oldEntry = oldComponentsMap.get(newComponent.id);
    if (oldEntry) {
      const oldComponent = oldEntry.component;
      
      // 为了调试，记录比较的组件
      console.log(`Comparing component ${newComponent.id} of type ${newComponent.type}`);
      
      // 比较除'id'外的属性
      // 首先检查顶层属性的变化
      const topLevelKeys = new Set([
        ...Object.keys(oldComponent),
        ...Object.keys(newComponent)
      ].filter(key => key !== 'id'));
      
      for (const key of topLevelKeys) {
        // 跳过style对象，后面单独处理
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
      
      // 检查style属性的变化
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

// 快照存储的类型
// 创建快照存储
const useSnapShotStore = create<SnapShotState & SnapShotActions>((set, get) => ({
  // 状态
  snapshots: [],
  snapshotIndex: -1,
  isRecording: false,
  // 添加getter，兼容旧代码中可能使用的snapshotData属性
  get snapshotData() {
    return get().snapshots;
  },

  // 操作
  undo: () => {
    set((state) => {
      if (state.snapshotIndex >= 0) {
        // 获取当前要撤销的快照
        const currentSnapshot = state.snapshots[state.snapshotIndex];
        const newIndex = state.snapshotIndex - 1;
        
        // 获取当前组件数据
        let componentData = useEditorStore.getState().componentData;
        
        // 逆序应用当前快照中的所有操作
        for (let i = currentSnapshot.length - 1; i >= 0; i--) {
          componentData = revertDiff(componentData, currentSnapshot[i]);
        }
        
        // 更新编辑器存储
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
        
        // 获取当前组件数据
        let componentData = useEditorStore.getState().componentData;
        
        // 应用下一个快照中的所有操作
        for (const operation of snapshotToApply) {
          componentData = applyDiff(componentData, operation);
        }
        
        // 更新编辑器存储
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
      // 防止递归调用
      if (state.isRecording) {
        return state;
      }
      
      // 获取当前组件数据
      const currentComponents = useEditorStore.getState().componentData;
      
      // 记录当前所有组件的ID和类型，方便调试
      console.log('Current components:', currentComponents.map(c => ({ id: c.id, type: c.type })));
      
      // 如果是第一次快照，初始化组件映射
      if (state.snapshotIndex === -1 && state.snapshots.length === 0) {
        componentMap.clear();
        currentComponents.forEach(component => {
          componentMap.set(component.id, deepCopy(component));
        });
      }
      
      try {
        // 设置录制标志
        state.isRecording = true;
        
        // 获取前一个组件数据（从上一个快照或默认数据）
        let previousComponents: Component[];
        if (state.snapshotIndex >= 0) {
          // 需要通过应用所有diff重建到当前索引的前一个状态
          previousComponents = [...getDefaultComponentData()];
          console.log('Previous components:', previousComponents);
          for (let i = 0; i <= state.snapshotIndex; i++) {
            for (const operation of state.snapshots[i]) {
              previousComponents = applyDiff(previousComponents, operation);
            }
          }
        } else {
          previousComponents = getDefaultComponentData();
          console.log('Previous components:', previousComponents);
        }
        
        // 记录重建的上一状态中的组件ID和类型，方便调试
        console.log('Previous components:', previousComponents.map(c => ({ id: c.id, type: c.type })));
        
        // 生成前后状态的差异
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
        
        // 如果没有差异，不创建新快照
        if (filteredDiffs.length === 0) {
          console.log('No changes detected, not creating snapshot');
          return { ...state, isRecording: false };
        }
        
        console.log('Recording snapshot with filtered diffs:', filteredDiffs);
        
        // 创建更新后的快照数组
        const newIndex = state.snapshotIndex + 1;
        let newSnapshots;
        
        if (newIndex > 0 && newIndex < state.snapshots.length) {
          // 截断当前索引之后的快照
          newSnapshots = [...state.snapshots.slice(0, newIndex), filteredDiffs];
        } else {
          // 在末尾添加新快照
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
