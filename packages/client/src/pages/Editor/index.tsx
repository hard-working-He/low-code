import React from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import type { Component } from '@/stores/useEditorStore';
import LText from '@/components/LText';
import LButton from '@/components/LButton';
import LPicture from '@/components/LPicture';
import './index.scss';
import { throttle } from '@/utils/throttle'; 

// 组件映射表
const componentMap: Record<string, React.ComponentType<any>> = {
  'text': LText,
  'button': LButton,
  'picture': LPicture,
};

const Editor: React.FC = () => {
  // 从 store 中获取组件数据
  const componentData = useEditorStore((state) => state.componentData);
  const updateComponentDataPropValue = useEditorStore((state) => state.updateComponentDataPropValue);
  const updateComponentPosition = useEditorStore((state) => state.updateComponentPosition);
  // 渲染每个组件
  const renderComponent = (component: Component) => {
    const DynamicComponent = componentMap[component.type];
    
    // 如果找不到对应的组件，返回空
    if (!DynamicComponent) {
      console.warn(`组件类型 "${component.type}" 未注册`);
      return null;
    }
    
    return (
      <div
        key={component.id}
        draggable={true}
        style={{
          position: 'absolute',
          ...component.style
        }}
        onMouseDown={(e) => handleMouseDown(e, component)}
      >
        <DynamicComponent
          propValue={component.propValue}
          element={component}
          onInput={handleChange}
        />
      </div>
    );
  };

  const handleChange = (element: Component, value: string) => {
    console.log(element, value);
    updateComponentDataPropValue(element, value);
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, component: Component) => {
    e.stopPropagation()

    const pos = { ...component.style }
    const startY = e.clientY
    const startX = e.clientX
    // 如果直接修改属性，值的类型会变为字符串，所以要转为数值型
    const startTop = Number(pos.top)
    const startLeft = Number(pos.left)

    const move = throttle((moveEvent: React.MouseEvent<HTMLDivElement>) => {
        const currX = moveEvent.clientX
        const currY = moveEvent.clientY
        pos.top = currY - startY + startTop
        pos.left = currX - startX + startLeft
        // 修改当前组件样式
        updateComponentPosition(component.id, pos.left, pos.top)
    }, 16); // ~60fps

    const up = () => {
        document.removeEventListener('mousemove', move as any)
        document.removeEventListener('mouseup', up)
    }

    document.addEventListener('mousemove', move as any)
    document.addEventListener('mouseup', up)
}

  return (
    <div className="editor-container">
      {/* 画布区域 */}
      <div className="canvas-container">
        {componentData.map(renderComponent)}
      </div>
    </div>
  );
};

export default Editor;