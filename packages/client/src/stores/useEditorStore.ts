/* 用一个数组 componentData 维护编辑器中的数据。
把组件拖拽到画布中时，使用 push() 方法将新的组件数据添加到 componentData。
编辑器使用 JSX 语法结合 render() 将每个组件逐个渲染到画布 */

import { create } from 'zustand'

// 组件类型定义
export interface Component {
  id: string;
  index: number;
  type: string;
  propValue: string|object;
  component?: string;
  label?: string;
  icon?: string;
  animations?: any[];
  events?: object;
  isLock?: boolean;
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
}

export const useEditorStore = create<EditorStore>((set) => ({
    // 从localStorage中获取历史记录，如果localStorage中没有历史记录，则初始化一个默认值
    componentData: localStorage.getItem('历史记录') ? JSON.parse(localStorage.getItem('历史记录') || '[]') : [{
        id: '1',
        index: 1,
        type: 'text',
        propValue: 'Hello, world!',
        style: {
            top: 0,
            left: 0,
            width: 100,
            height: 100,
        },
    },
    {
        id: '2',
        index: 2,
        type: 'button',
        propValue: 'Hello, world!',
        style: {
            top: 100,
            left: 100,
            width: 100,
            height: 100,
        },
    }
],
    addComponent: (component: Component) => set((state: EditorStore) => ({ componentData: [...state.componentData, component] })),
    //更新propValue
    updateComponentDataPropValue: (element: Component, value: string) => set((state: EditorStore) => ({
        componentData: state.componentData.map((item) => {
          if (item.id === element.id) {
            return { ...item, propValue: value };
          }
          return item;
        })
      })),
      //更新组件位置和样式
      updateComponentPosition: (id: string, left?: number, top?: number, additionalStyles?: any) => set((state: EditorStore) => {
        console.log('Updating component position:', id, { left, top, ...additionalStyles });
        return {
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
      }),
      // 通用更新组件函数，可以更新任何属性包括样式
      updateComponent: (id: string, key: string, value: any) => set((state: EditorStore) => {
        return {
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
      }),
      //清空画布
      clearComponentData: () => set(() => ({ componentData: [] })),
      //删除组件
      deleteComponent: (id: string) => set((state: EditorStore) => ({ componentData: state.componentData.filter((item) => item.id !== id) })),
      //设置组件数据
      setComponentData: (data: Component[]) => {
        // 确保我们对数据进行深拷贝，避免引用问题
        const deepCopiedData = JSON.parse(JSON.stringify(data));
        return set(() => ({ componentData: deepCopiedData }));
      },
}))