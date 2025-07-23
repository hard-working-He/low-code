import { create } from 'zustand';
import { useEditorStore } from './useEditorStore';
import { useLayerStore } from './useLayerStore';
import { $ } from '@/utils/utils';
import type { Component } from './useEditorStore';

// 组合功能的Store类型
interface ComposeStore {
  // 选中区域包含的组件以及区域位移信息
  areaData: {
    style: {
      top: number;
      left: number;
      width: number;
      height: number;
    };
    components: Component[];
  };
  editor: HTMLElement | null;
  isShowArea: boolean;
  start: { x: number; y: number };
  width: number;
  height: number;
  
  // actions
  getEditor: () => void;
  setAreaData: (data: ComposeStore['areaData']) => void;
  setShowArea: (isShow: boolean) => void;
  setStart: (x: number, y: number) => void;
  setAreaSize: (width: number, height: number) => void;
  compose: () => void;
  decompose: () => void;
  hideArea: () => void;
  getSelectArea: () => Component[];
  createGroup: () => void;
}

export const useComposeStore = create<ComposeStore>((set, get) => ({
  // 选中区域数据
  areaData: {
    style: {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
    },
    components: [],
  },
  editor: null,
  isShowArea: false,
  start: { x: 0, y: 0 },
  width: 0,
  height: 0,
  
  // 获取编辑器DOM元素
  getEditor: () => {
    const editor = $('#editor');
    set({ editor });
  },

  // 设置区域数据
  setAreaData: (data) => {
    set({ areaData: data });
  },
  
  // 设置是否显示选择区域
  setShowArea: (isShow) => {
    set({ isShowArea: isShow });
  },
  
  // 设置起始点
  setStart: (x, y) => {
    set({ start: { x, y } });
  },
  
  // 设置区域大小
  setAreaSize: (width, height) => {
    set({ width, height });
  },

  // 组合组件
  compose: () => {
    const { areaData } = get();
    const componentsToCompose = [...areaData.components];
    
    if (componentsToCompose.length <= 1) return;
    
    // 使用editorStore的方法手动组合组件
    const editorStore = useEditorStore.getState();
    const componentData = [...editorStore.componentData];
    
    // 1. 计算包含所有组件的最小区域
    let left = Infinity, top = Infinity;
    let right = -Infinity, bottom = -Infinity;
    
    componentsToCompose.forEach(component => {
      const { style } = component;
      const componentLeft = style.left;
      const componentTop = style.top;
      const componentRight = style.left + (style.width || 0);
      const componentBottom = style.top + (style.height || 0);
      
      if (componentLeft < left) left = componentLeft;
      if (componentTop < top) top = componentTop;
      if (componentRight > right) right = componentRight;
      if (componentBottom > bottom) bottom = componentBottom;
    });
    
    // 2. 计算组合后的宽高
    const width = right - left;
    const height = bottom - top;
    
    // 3. 计算每个组件在Group中的相对位置和大小
    const groupComponents = componentsToCompose.map(component => {
      const style = { ...component.style };
      const groupStyle = {
        left: ((style.left - left) / width * 100) + '%',
        top: ((style.top - top) / height * 100) + '%',
        width: ((style.width || 0) / width * 100) + '%',
        height: ((style.height || 0) / height * 100) + '%',
        rotate: style.rotate || 0
      };
      
      return { ...component, groupStyle };
    });
    
    // 4. 创建Group组件
    const newGroupId = 'group-' + Date.now();
    const groupComponent: Component = {
      id: newGroupId,
      index: componentData.length,
      type: 'group',
      component: 'LGroup',
      label: 'Group',
      icon: 'folder',
      propValue: groupComponents,
      style: {
        left,
        top,
        width,
        height,
        rotate: 0,
      }
    };
    
    // 5. 移除原组件，添加新的Group组件
    const remainingComponents = componentData.filter(component => 
      !componentsToCompose.some(c => c.id === component.id)
    );
    
    // 6. 更新组件数据
    editorStore.setComponentData([...remainingComponents, groupComponent]);
    
    // 7. 设置当前选中组件为新的Group组件
    const layerStore = useLayerStore.getState();
    layerStore.setCurComponent(groupComponent, remainingComponents.length);
    
    // 8. 隐藏选择区域
    set({ isShowArea: false, areaData: { ...get().areaData, components: [] } });
  },

  // 拆分组件
  decompose: () => {
    const curComponent = useLayerStore.getState().curComponent;
    
    if (!curComponent || curComponent.type !== 'group') return;
    
    const editorStore = useEditorStore.getState();
    const componentData = [...editorStore.componentData];
    
    // 1. 获取组合组件和它的子组件
    const groupComponents = curComponent.propValue as Component[];
    const { style: groupStyle } = curComponent;
    
    // 2. 恢复子组件的绝对位置和大小
    const restoredComponents = groupComponents.map(item => {
      const newComponent = { ...item };
      
      // 将相对位置转换为绝对位置
      // 使用类型断言解决TS类型错误
      const groupStyleProp = (item as any).groupStyle || {};
      const left = groupStyle.left + parseFloat(groupStyleProp.left || '0%') * groupStyle.width! / 100;
      const top = groupStyle.top + parseFloat(groupStyleProp.top || '0%') * groupStyle.height! / 100;
      const width = parseFloat(groupStyleProp.width || '100%') * groupStyle.width! / 100;
      const height = parseFloat(groupStyleProp.height || '100%') * groupStyle.height! / 100;
      
      newComponent.style = {
        ...newComponent.style,
        left,
        top,
        width,
        height
      };
      
      return newComponent;
    });
    
    // 3. 移除原Group组件，添加恢复后的组件
    const remainingComponents = componentData.filter(c => c.id !== curComponent.id);
    
    // 4. 更新组件数据
    editorStore.setComponentData([...remainingComponents, ...restoredComponents]);
    
    // 5. 取消选中组件
    useLayerStore.getState().setCurComponent(null, -1);
  },
  
  // 隐藏选择区域
  hideArea: () => {
    set({ 
      isShowArea: false,
      areaData: {
        style: {
          top: 0,
          left: 0,
          width: 0,
          height: 0,
        },
        components: [],
      }
    });
  },
  
  // 获取选中区域内的组件
  getSelectArea: () => {
    const { start, width, height } = get();
    const componentData = useEditorStore.getState().componentData;
    const result: Component[] = [];
    
    console.log('Finding components in area:', start.x, start.y, width, height);
    
    // 区域起点坐标
    const { x, y } = start;
    
    // 计算所有的组件数据，判断是否在选中区域内
    componentData.forEach(component => {
      if (component.isLock) return;
      
      const { left, top, width: compWidth, height: compHeight } = component.style;
      
      // 检查组件是否在选区内（完全包含）
      if (x <= left && 
          y <= top && 
          (left + (compWidth || 0) <= x + width) && 
          (top + (compHeight || 0) <= y + height)) {
        console.log('Component found in area:', component.id);
        result.push(component);
      }
      
      // 也可以考虑组件与选区有交叉的情况
      // 只要组件和选区有交叉，就认为是选中了这个组件
      // else if (!(left >= x + width || 
      //          left + (compWidth || 0) <= x || 
      //          top >= y + height || 
      //          top + (compHeight || 0) <= y)) {
      //   console.log('Component partially in area:', component.id);
      //   result.push(component);
      // }
    });
    
    console.log(`Found ${result.length} components in selection area`);
    
    // 返回在选中区域内的所有组件
    return result;
  },
  
  // 创建组合区域
  createGroup: () => {
    // 获取选中区域的组件数据
    const areaData = get().getSelectArea();
    if (areaData.length <= 1) {
      get().hideArea();
      return;
    }

    console.log('Found components in selection area:', areaData.length);

    // 根据选中区域和区域中每个组件的位移信息来创建组合区域
    // 要遍历选择区域的每个组件，获取它们的位置信息进行比较
    let top = Infinity, left = Infinity;
    let right = -Infinity, bottom = -Infinity;
    //const editor = get().editor;
    // const editorX = editor?.getBoundingClientRect().x || 0;
    // const editorY = editor?.getBoundingClientRect().y || 0;
    
    areaData.forEach(component => {
      const { style } = component;
      const componentLeft = style.left;
      const componentTop = style.top;
      const componentRight = style.left + (style.width || 0);
      const componentBottom = style.top + (style.height || 0);
      
      if (componentLeft < left) left = componentLeft;
      if (componentTop < top) top = componentTop;
      if (componentRight > right) right = componentRight;
      if (componentBottom > bottom) bottom = componentBottom;
    });

    const width = right - left;
    const height = bottom - top;
    
    // 设置选中区域位移大小信息和区域内的组件数据
    set({
      start: { x: left, y: top },
      width,
      height,
      areaData: {
        style: {
          left,
          top,
          width,
          height,
        },
        components: areaData,
      }
    });
    
    // 显示选中的区域和组件数量
    console.log(`Selection area created: ${left},${top} ${width}x${height} with ${areaData.length} components`);
  }
}));
