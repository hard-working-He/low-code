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
function generateDiffs(oldList: Component[], newList: Component[]): DiffOperation[] {
  let diffs: DiffOperation[] = [];
  let oldIndex = 0, newIndex = 0;

  // 1. 头尾同步扫描
  while (oldIndex < oldList.length && newIndex < newList.length) {
    if (oldList[oldIndex].id === newList[newIndex].id && oldList[oldIndex].type === newList[newIndex].type) {
      // diff 属性
      diffs.push(...diffProps(oldList[oldIndex], newList[newIndex]));
      oldIndex++;
      newIndex++;
    } else {
      break;
    }
  }

  // 2. 处理剩余节点
  const oldRemain = oldList.slice(oldIndex);
  const newRemain = newList.slice(newIndex);

  // 2.1 oldRemain 里有但 newRemain 没有的，删除
  const newRemainIds = new Set(newRemain.map(c => c.id));
  for (const oldNode of oldRemain) {
    if (!newRemainIds.has(oldNode.id)) {
      diffs.push(markForDelete(oldNode));
    }
  }

  // 2.2 newRemain 里有但 oldRemain 没有的，新增
  const oldRemainIds = new Set(oldRemain.map(c => c.id));
  for (const newNode of newRemain) {
    if (!oldRemainIds.has(newNode.id)) {
      diffs.push(markForAdd(newNode));
    }
  }

  // 3. 移动优化
  // 找出 newRemain 里复用的节点在 oldRemain 的索引序列
  const oldIdToIndex = new Map<string, number>();
  oldRemain.forEach((node, idx) => oldIdToIndex.set(node.id, idx));
  const reusedOldIndexes: number[] = [];
  newRemain.forEach(node => {
    if (oldIdToIndex.has(node.id)) {
      reusedOldIndexes.push(oldIdToIndex.get(node.id)!);
    }
  });
  // 求 LIS
  const lis = getLIS(reusedOldIndexes);
  // 非 LIS 的节点需要移动
  // ...生成 moveDiffs（可选，暂未实现）

  return diffs;
}

// 更细致的属性 diff
function diffProps(oldNode: Component, newNode: Component): DiffOperation[] {
  const diffs: DiffOperation[] = [];
  const keys = new Set([
    ...Object.keys(oldNode),
    ...Object.keys(newNode)
  ].filter(key => key !== 'id'));

  const changedKeys: string[] = [];
  const oldValues: any[] = [];
  const newValues: any[] = [];

  for (const key of keys) {
    if (key === 'style') continue; // style 单独处理
    const oldValue = (oldNode as any)[key];
    const newValue = (newNode as any)[key];
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changedKeys.push(key);
      oldValues.push(deepCopy(oldValue));
      newValues.push(deepCopy(newValue));
    }
  }

  // style diff
  if (oldNode.style && newNode.style) {
    const styleKeys = new Set([
      ...Object.keys(oldNode.style),
      ...Object.keys(newNode.style)
    ]);
    for (const styleKey of styleKeys) {
      const oldStyleValue = oldNode.style[styleKey];
      const newStyleValue = newNode.style[styleKey];
      if (typeof oldStyleValue === 'number' && typeof newStyleValue === 'number') {
        if (Math.abs(oldStyleValue - newStyleValue) < 0.1) continue;
      }
      if (JSON.stringify(oldStyleValue) !== JSON.stringify(newStyleValue)) {
        changedKeys.push(`style.${styleKey}`);
        oldValues.push(deepCopy(oldStyleValue));
        newValues.push(deepCopy(newStyleValue));
      }
    }
  }

  if (changedKeys.length > 0) {
    diffs.push({
      componentId: newNode.id,
      type: DiffType.MODIFY,
      data: {
        keys: changedKeys,
        oldValues,
        newValues
      }
    } as ModifyOperation);
  }
  return diffs;
}

function markForDelete(node: Component): DiffOperation {
  return {
    componentId: node.id,
    type: DiffType.DELETE,
    index: -1, // 你可以传实际 index
    data: deepCopy(node)
  } as DeleteOperation;
}

function markForAdd(node: Component): DiffOperation {
  return {
    componentId: node.id,
    type: DiffType.ADD,
    index: -1, // 你可以传实际 index
    data: deepCopy(node)
  } as AddOperation;
}

// 最长递增子序列（LIS）算法
function getLIS(arr: number[]): number[] {
  const p = arr.slice();
  const result: number[] = [];
  let u: number, v: number;
  if (arr.length === 0) return result;
  result.push(0);
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > arr[result[result.length - 1]]) {
      p[i] = result[result.length - 1];
      result.push(i);
      continue;
    }
    u = 0;
    v = result.length - 1;
    while (u < v) {
      const c = ((u + v) / 2) | 0;
      if (arr[result[c]] < arr[i]) u = c + 1;
      else v = c;
    }
    if (arr[i] < arr[result[u]]) {
      if (u > 0) p[i] = result[u - 1];
      result[u] = i;
    }
  }
  u = result.length;
  v = result[result.length - 1];
  const lis: number[] = [];
  while (u-- > 0) {
    lis[u] = v;
    v = p[v];
  }
  return lis.map(i => arr[i]);
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
