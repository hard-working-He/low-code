/* 用一个数组 componentData 维护编辑器中的数据。
把组件拖拽到画布中时，使用 push() 方法将新的组件数据添加到 componentData。
编辑器使用 JSX 语法结合 render() 将每个组件逐个渲染到画布 */

import { create } from 'zustand'

// 组件类型定义
export interface Component {
  id: string;
  type: string;
  propValue: string|object;
  style: {
    top: number;
    left: number;
    width: number;
    height: number;
    zIndex: number;
    [key: string]: any;
  };
}

// 编辑器存储类型
interface EditorStore {
  componentData: Component[];
  addComponent: (component: Component) => void;
  updateComponentDataPropValue: (element: Component, value: string) => void;
  updateComponentPosition: (id: string, left: number, top: number) => void;
  clearComponentData: () => void;
  deleteComponent: (id: string) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
    componentData: [{
        id: '1',
        type: 'text',
        propValue: 'Hello, world!',
        style: {
            top: 0,
            left: 0,
            width: 100,
            height: 100,
            zIndex: 1,
        },
    },
    {
        id: '2',
        type: 'button',
        propValue: 'Hello, world!',
        style: {
            top: 100,
            left: 100,
            width: 100,
            height: 100,
            zIndex: 2,
        },
    },
    {
        id: '3',
        type: 'picture',
        propValue: {
            url: 'https://picsum.photos/200/300',
            flip: {
                vertical: false,
                horizontal: false,
            },
        },
        style: {
            top: 200,
            left: 200,
            width: 200,
            height: 300,
            zIndex: 3,
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
      //更新组件位置
      updateComponentPosition: (id: string, left: number, top: number) => set((state: EditorStore) => ({
        componentData: state.componentData.map((item) => {
          if (item.id === id) {
            return { ...item, style: { ...item.style, left, top } };
          }
          return item;
        })
      })),
      //清空画布
      clearComponentData: () => set((state: EditorStore) => ({ componentData: [] })),
      //删除组件
      deleteComponent: (id: string) => set((state: EditorStore) => ({ componentData: state.componentData.filter((item) => item.id !== id) })),
}))