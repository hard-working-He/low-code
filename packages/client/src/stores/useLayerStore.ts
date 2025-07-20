import { create } from 'zustand'
import { swap } from '@/utils/utils'
import toast from '@/utils/toast'
import { useEditorStore } from '@/stores/useEditorStore'
import type { Component } from '@/stores/useEditorStore'

interface LayerState {
  componentData: Component[]
  curComponentIndex: number
  curComponent: Component | null
  
  // Actions for layer management
  upComponent: () => void
  downComponent: () => void
  topComponent: () => void
  bottomComponent: () => void
  
  // Setters
  setCurComponent: (component: Component | null, index: number) => void
  setComponentData: (components: Component[]) => void
  getComponentData: () => Component[]
}

// 创建 Layer Store
export const useLayerStore = create<LayerState>((set, get) => {
  // 订阅 EditorStore
  useEditorStore.subscribe((state) => {
    set({ componentData: state.componentData });
  });
  
  return {
    componentData: useEditorStore.getState().componentData,
    curComponentIndex: -1,
    curComponent: null,
    
    setCurComponent: (component, index) => {
      set({ curComponent: component, curComponentIndex: index });
    },
    
    setComponentData: (components) => {
      set({ componentData: components });
    },
    
    getComponentData: () => useEditorStore.getState().componentData,
    
    upComponent: () => {
      const { componentData, curComponentIndex } = get();
      // 上移图层 index，表示元素在数组中越往后
      if (curComponentIndex < componentData.length - 1) {
        const newComponentData = [...componentData];
        swap(newComponentData, curComponentIndex, curComponentIndex + 1);
        set({ 
          componentData: newComponentData,
          curComponentIndex: curComponentIndex + 1 
        });
        // 同步更新到 EditorStore
        useEditorStore.setState({ componentData: newComponentData });
      } else {
        toast('已经到顶了');
      }
    },
    
    downComponent: () => {
      const { componentData, curComponentIndex } = get();
      // 下移图层 index，表示元素在数组中越往前
      if (curComponentIndex > 0) {
        const newComponentData = [...componentData];
        swap(newComponentData, curComponentIndex, curComponentIndex - 1);
        set({ 
          componentData: newComponentData,
          curComponentIndex: curComponentIndex - 1 
        });
        // 同步更新到 EditorStore
        useEditorStore.setState({ componentData: newComponentData });
      } else {
        toast('已经到底了');
      }
    },
    
    topComponent: () => {
      const { componentData, curComponentIndex, curComponent } = get();
      // 置顶
      if (curComponentIndex < componentData.length - 1 && curComponent) {
        const newComponentData = [...componentData];
        newComponentData.splice(curComponentIndex, 1);
        newComponentData.push(curComponent);
        set({
          componentData: newComponentData,
          curComponentIndex: newComponentData.length - 1
        });
        // 同步更新到 EditorStore
        useEditorStore.setState({ componentData: newComponentData });
      } else {
        toast('已经到顶了');
      }
    },
    
    bottomComponent: () => {
      const { componentData, curComponentIndex, curComponent } = get();
      // 置底
      if (curComponentIndex > 0 && curComponent) {
        const newComponentData = [...componentData];
        newComponentData.splice(curComponentIndex, 1);
        newComponentData.unshift(curComponent);
        set({
          componentData: newComponentData,
          curComponentIndex: 0
        });
        // 同步更新到 EditorStore
        useEditorStore.setState({ componentData: newComponentData });
      } else {
        toast('已经到底了');
      }
    },
  };
});

export default useLayerStore
