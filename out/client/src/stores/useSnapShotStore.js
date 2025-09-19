"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSnapShotStore = void 0;
exports.setDefaultComponentData = setDefaultComponentData;
// -------------------- 类型、常量、全局变量 --------------------
const zustand_1 = require("zustand");
const useSnapShotStore_types_1 = require("./useSnapShotStore.types");
const useEditorStore_1 = require("./useEditorStore");
const utils_1 = require("@/utils/utils");
// 默认组件数据存储
let defaultComponentData = [];
// 组件ID到组件的映射，便于高效查找
let componentMap = new Map();
/** 获取默认组件数据的副本 */
function getDefaultComponentData() {
    return JSON.parse(JSON.stringify(defaultComponentData));
}
/** 设置默认组件数据并初始化组件映射 */
function setDefaultComponentData(data = []) {
    defaultComponentData = data;
    componentMap.clear();
    data.forEach(component => {
        componentMap.set(component.id, (0, utils_1.deepCopy)(component));
    });
}
// -------------------- Diff 相关辅助函数 --------------------
/**
 * 应用单个 diff 操作到组件数据
 */
function applyDiff(componentData, diff) {
    console.time(`applyDiff:${diff.componentId}:${diff.type}`);
    const result = [...componentData];
    switch (diff.type) {
        case useSnapShotStore_types_1.DiffType.ADD:
            result.splice(diff.index, 0, (0, utils_1.deepCopy)(diff.data));
            componentMap.set(diff.componentId, (0, utils_1.deepCopy)(diff.data));
            break;
        case useSnapShotStore_types_1.DiffType.DELETE:
            result.splice(diff.index, 1);
            componentMap.delete(diff.componentId);
            break;
        case useSnapShotStore_types_1.DiffType.MODIFY:
            const modifyOp = diff;
            const componentIndex = result.findIndex(comp => comp.id === diff.componentId);
            if (componentIndex !== -1) {
                let component = result[componentIndex];
                const { keys, newValues } = modifyOp.data;
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const newValue = newValues[i];
                    if (key.includes('.')) {
                        const [objKey, propKey] = key.split('.');
                        component = {
                            ...component,
                            [objKey]: {
                                ...component[objKey],
                                [propKey]: newValue
                            }
                        };
                    }
                    else {
                        component = {
                            ...component,
                            [key]: newValue
                        };
                    }
                }
                result[componentIndex] = component;
                componentMap.set(diff.componentId, (0, utils_1.deepCopy)(result[componentIndex]));
            }
            break;
    }
    console.timeEnd(`applyDiff:${diff.componentId}:${diff.type}`);
    return result;
}
/**
 * 撤销单个 diff 操作到组件数据
 */
function revertDiff(componentData, diff) {
    console.time(`revertDiff:${diff.componentId}:${diff.type}`);
    const result = [...componentData];
    switch (diff.type) {
        case useSnapShotStore_types_1.DiffType.ADD:
            const addIndex = result.findIndex(comp => comp.id === diff.componentId);
            if (addIndex !== -1) {
                result.splice(addIndex, 1);
                componentMap.delete(diff.componentId);
            }
            break;
        case useSnapShotStore_types_1.DiffType.DELETE:
            const deleteOp = diff;
            result.splice(deleteOp.index, 0, (0, utils_1.deepCopy)(deleteOp.data));
            componentMap.set(diff.componentId, (0, utils_1.deepCopy)(deleteOp.data));
            break;
        case useSnapShotStore_types_1.DiffType.MODIFY:
            const modifyOp = diff;
            const componentIndex = result.findIndex(comp => comp.id === diff.componentId);
            if (componentIndex !== -1) {
                let component = result[componentIndex];
                const { keys, oldValues } = modifyOp.data;
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const oldValue = oldValues[i];
                    if (key.includes('.')) {
                        const [objKey, propKey] = key.split('.');
                        component = {
                            ...component,
                            [objKey]: {
                                ...component[objKey],
                                [propKey]: oldValue
                            }
                        };
                    }
                    else {
                        component = {
                            ...component,
                            [key]: oldValue
                        };
                    }
                }
                result[componentIndex] = component;
                componentMap.set(diff.componentId, (0, utils_1.deepCopy)(result[componentIndex]));
            }
            break;
    }
    console.timeEnd(`revertDiff:${diff.componentId}:${diff.type}`);
    return result;
}
// -------------------- 主 store 及核心 diff 算法 --------------------
/**
 * 快照存储（包含撤销、重做、快照记录等功能）
 */
const useSnapShotStore = (0, zustand_1.create)((set, get) => ({
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
        console.time('undo');
        set((state) => {
            if (state.snapshotIndex >= 0) {
                // 获取当前要撤销的快照
                const currentSnapshot = state.snapshots[state.snapshotIndex];
                const newIndex = state.snapshotIndex - 1;
                // 获取当前组件数据
                let componentData = useEditorStore_1.useEditorStore.getState().componentData;
                // 逆序应用当前快照中的所有操作
                for (let i = currentSnapshot.length - 1; i >= 0; i--) {
                    componentData = revertDiff(componentData, currentSnapshot[i]);
                }
                // 更新编辑器存储
                useEditorStore_1.useEditorStore.setState({ componentData });
                console.log('Undo: Reverted to snapshot', newIndex);
                console.timeEnd('undo');
                return {
                    snapshotIndex: newIndex
                };
            }
            console.timeEnd('undo');
            return state;
        });
    },
    redo: () => {
        console.time('redo');
        set((state) => {
            if (state.snapshotIndex < state.snapshots.length - 1) {
                const newIndex = state.snapshotIndex + 1;
                const snapshotToApply = state.snapshots[newIndex];
                // 获取当前组件数据
                let componentData = useEditorStore_1.useEditorStore.getState().componentData;
                // 应用下一个快照中的所有操作
                for (const operation of snapshotToApply) {
                    componentData = applyDiff(componentData, operation);
                }
                // 更新编辑器存储
                useEditorStore_1.useEditorStore.setState({ componentData });
                console.log('Redo: Applied snapshot', newIndex);
                console.timeEnd('redo');
                return {
                    snapshotIndex: newIndex
                };
            }
            console.timeEnd('redo');
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
            const currentComponents = useEditorStore_1.useEditorStore.getState().componentData;
            // 记录当前所有组件的ID和类型，方便调试
            console.log('Current components:', currentComponents.map(c => ({ id: c.id, type: c.type })));
            // 如果是第一次快照，初始化组件映射
            if (state.snapshotIndex === -1 && state.snapshots.length === 0) {
                componentMap.clear();
                currentComponents.forEach(component => {
                    componentMap.set(component.id, (0, utils_1.deepCopy)(component));
                });
            }
            try {
                // 设置录制标志
                state.isRecording = true;
                // 获取前一个组件数据（从上一个快照或默认数据）
                let previousComponents;
                if (state.snapshotIndex >= 0) {
                    previousComponents = [...getDefaultComponentData()];
                    console.log('Previous components:', previousComponents);
                    for (let i = 0; i <= state.snapshotIndex; i++) {
                        for (const operation of state.snapshots[i]) {
                            previousComponents = applyDiff(previousComponents, operation);
                        }
                    }
                }
                else {
                    previousComponents = getDefaultComponentData();
                    console.log('Previous components:', previousComponents);
                }
                // 记录重建的上一状态中的组件ID和类型，方便调试
                console.log('Previous components:', previousComponents.map(c => ({ id: c.id, type: c.type })));
                // 创建ID映射以快速检查组件是否存在于两个列表中
                const prevComponentMap = new Map();
                previousComponents.forEach(comp => prevComponentMap.set(comp.id, comp));
                const currentComponentMap = new Map();
                currentComponents.forEach(comp => currentComponentMap.set(comp.id, comp));
                // 生成前后状态的差异
                console.time('generateDiffs');
                // 检查是否所有组件ID都匹配（仅移动而非添加/删除）
                const isJustMovement = previousComponents.length === currentComponents.length &&
                    previousComponents.every(prev => currentComponentMap.has(prev.id)) &&
                    currentComponents.every(curr => prevComponentMap.has(curr.id));
                let diffs;
                if (isJustMovement) {
                    // 如果只是移动，直接生成位置修改的diff
                    console.log('Detected movement only, optimizing diff generation');
                    diffs = [];
                    for (const curr of currentComponents) {
                        const prev = prevComponentMap.get(curr.id);
                        // 仅比较位置属性，避免错误地生成添加/删除操作
                        if (curr.style && prev.style) {
                            const positionChanged = Math.abs(curr.style.top - prev.style.top) >= 0.1 ||
                                Math.abs(curr.style.left - prev.style.left) >= 0.1;
                            if (positionChanged) {
                                diffs.push({
                                    componentId: curr.id,
                                    type: useSnapShotStore_types_1.DiffType.MODIFY,
                                    data: {
                                        keys: ['style.top', 'style.left'],
                                        oldValues: [prev.style.top, prev.style.left],
                                        newValues: [curr.style.top, curr.style.left]
                                    }
                                });
                            }
                        }
                    }
                }
                else {
                    // 正常的diff生成
                    diffs = generateDiffs(previousComponents, currentComponents);
                }
                console.timeEnd('generateDiffs');
                // 过滤掉可能的错误修改，如拖拽时不应该有类型变化
                const filteredDiffs = diffs.filter(diff => {
                    if (diff.type === useSnapShotStore_types_1.DiffType.MODIFY) {
                        const modifyOp = diff;
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
                    newSnapshots = [...state.snapshots.slice(0, newIndex), filteredDiffs];
                }
                else {
                    newSnapshots = [...state.snapshots, filteredDiffs];
                }
                console.log('New snapshots array:', newSnapshots, 'New index:', newIndex);
                return {
                    snapshotIndex: newIndex,
                    snapshots: newSnapshots,
                    isRecording: false
                };
            }
            catch (error) {
                console.error('Failed to record snapshot:', error);
                return { ...state, isRecording: false };
            }
        });
    }
}));
exports.useSnapShotStore = useSnapShotStore;
exports.default = useSnapShotStore;
/**
 * 比较组件并生成差异操作（React Diff 优化版）
 */
function generateDiffs(oldList, newList) {
    console.time('generateDiffs:internal');
    let diffs = [];
    // 创建ID映射以快速查找组件
    const oldIdMap = new Map();
    const newIdMap = new Map();
    oldList.forEach(comp => oldIdMap.set(comp.id, comp));
    newList.forEach(comp => newIdMap.set(comp.id, comp));
    // 1. 找出相同ID的组件，生成属性差异（包括位置变化）
    const processedIds = new Set();
    for (const newComp of newList) {
        if (oldIdMap.has(newComp.id)) {
            // 组件存在于新旧两个列表中，进行属性比较
            const oldComp = oldIdMap.get(newComp.id);
            // 验证组件类型是否相同
            if (oldComp.type === newComp.type) {
                diffs.push(...diffProps(oldComp, newComp));
                processedIds.add(newComp.id);
            }
        }
    }
    // 2. 处理删除的组件（在旧列表中有但新列表中没有）
    for (const oldComp of oldList) {
        if (!newIdMap.has(oldComp.id) && !processedIds.has(oldComp.id)) {
            diffs.push(markForDelete(oldComp));
        }
    }
    // 3. 处理添加的组件（在新列表中有但旧列表中没有）
    for (const newComp of newList) {
        if (!oldIdMap.has(newComp.id) && !processedIds.has(newComp.id)) {
            diffs.push(markForAdd(newComp));
        }
    }
    console.timeEnd('generateDiffs:internal');
    return diffs;
}
// -------------------- Diff 相关辅助函数 --------------------
/**
 * 对比两个组件属性，生成 MODIFY diff
 */
function diffProps(oldNode, newNode) {
    console.time(`diffProps:${newNode.id}`);
    const diffs = [];
    const keys = new Set([
        ...Object.keys(oldNode),
        ...Object.keys(newNode)
    ].filter(key => key !== 'id'));
    const changedKeys = [];
    const oldValues = [];
    const newValues = [];
    // 优先处理位置变化，确保移动被识别为修改而非添加/删除
    // const positionKeys = ['style.top', 'style.left', 'style.width', 'style.height'];
    // let hasPositionChange = false;
    // 检查是否有位置变化
    if (oldNode.style && newNode.style) {
        for (const styleKey of ['top', 'left', 'width', 'height']) {
            const oldStyleValue = oldNode.style[styleKey];
            const newStyleValue = newNode.style[styleKey];
            if (typeof oldStyleValue === 'number' && typeof newStyleValue === 'number') {
                if (Math.abs(oldStyleValue - newStyleValue) >= 0.1) {
                    changedKeys.push(`style.${styleKey}`);
                    oldValues.push((0, utils_1.deepCopy)(oldStyleValue));
                    newValues.push((0, utils_1.deepCopy)(newStyleValue));
                    hasPositionChange = true;
                }
            }
        }
    }
    // 处理其他属性变化
    for (const key of keys) {
        if (key === 'style')
            continue; // style 单独处理
        const oldValue = oldNode[key];
        const newValue = newNode[key];
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changedKeys.push(key);
            oldValues.push((0, utils_1.deepCopy)(oldValue));
            newValues.push((0, utils_1.deepCopy)(newValue));
        }
    }
    // 处理其他样式属性
    if (oldNode.style && newNode.style) {
        const styleKeys = new Set([
            ...Object.keys(oldNode.style),
            ...Object.keys(newNode.style)
        ]);
        for (const styleKey of styleKeys) {
            // 跳过已处理的位置属性
            if (['top', 'left', 'width', 'height'].includes(styleKey))
                continue;
            const oldStyleValue = oldNode.style[styleKey];
            const newStyleValue = newNode.style[styleKey];
            if (typeof oldStyleValue === 'number' && typeof newStyleValue === 'number') {
                if (Math.abs(oldStyleValue - newStyleValue) < 0.1)
                    continue;
            }
            if (JSON.stringify(oldStyleValue) !== JSON.stringify(newStyleValue)) {
                changedKeys.push(`style.${styleKey}`);
                oldValues.push((0, utils_1.deepCopy)(oldStyleValue));
                newValues.push((0, utils_1.deepCopy)(newStyleValue));
            }
        }
    }
    if (changedKeys.length > 0) {
        diffs.push({
            componentId: newNode.id,
            type: useSnapShotStore_types_1.DiffType.MODIFY,
            data: {
                keys: changedKeys,
                oldValues,
                newValues
            }
        });
    }
    console.timeEnd(`diffProps:${newNode.id}`);
    return diffs;
}
/**
 * 生成删除操作 diff
 */
function markForDelete(node) {
    // 找到组件的实际索引
    let index = -1;
    const editorState = useEditorStore_1.useEditorStore.getState();
    if (editorState.componentData) {
        index = editorState.componentData.findIndex(comp => comp.id === node.id);
    }
    return {
        componentId: node.id,
        type: useSnapShotStore_types_1.DiffType.DELETE,
        index: index !== -1 ? index : -1,
        data: (0, utils_1.deepCopy)(node)
    };
}
/**
 * 生成新增操作 diff
 */
function markForAdd(node) {
    // 使用组件自身的索引属性或当前组件列表长度
    let index = -1;
    const editorState = useEditorStore_1.useEditorStore.getState();
    if (node.index !== undefined) {
        index = node.index;
    }
    else if (editorState.componentData) {
        // 如果没有指定索引，则添加到末尾
        index = editorState.componentData.length;
    }
    return {
        componentId: node.id,
        type: useSnapShotStore_types_1.DiffType.ADD,
        index: index,
        data: (0, utils_1.deepCopy)(node)
    };
}
/**
 * 最长递增子序列（LIS）算法
 */
function getLIS(arr) {
    const p = arr.slice();
    const result = [];
    let u, v;
    if (arr.length === 0)
        return result;
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
            if (arr[result[c]] < arr[i])
                u = c + 1;
            else
                v = c;
        }
        if (arr[i] < arr[result[u]]) {
            if (u > 0)
                p[i] = result[u - 1];
            result[u] = i;
        }
    }
    u = result.length;
    v = result[result.length - 1];
    const lis = [];
    while (u-- > 0) {
        lis[u] = v;
        v = p[v];
    }
    return lis.map(i => arr[i]);
}
// -------------------- 其他辅助函数（如 applyDiff/revertDiff）保持原位 --------------------
