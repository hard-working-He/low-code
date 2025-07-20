import React from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { useLayerStore } from '@/stores/useLayerStore';
import type { Component } from '@/stores/useEditorStore';
import LText from '@/components/LText';
import LButton from '@/components/LButton';
import LPicture from '@/components/LPicture';
import Shape from './Shape';
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
  
  // 从 LayerStore 中获取当前选中组件
  const curComponent = useLayerStore((state) => state.curComponent);
  const curComponentIndex = useLayerStore((state) => state.curComponentIndex);
  
  // 渲染每个组件
  const renderComponent = (component: Component, index: number) => {
    const DynamicComponent = componentMap[component.type];
    
    // 如果找不到对应的组件，返回空
    if (!DynamicComponent) {
      console.warn(`组件类型 "${component.type}" 未注册`);
      return null;
    }

    // 检查当前组件是否被选中
    const isActive = curComponent?.id === component.id;
    
    return (
      <Shape
        key={component.id}
        active={isActive}
        element={component}
        defaultStyle={component.style}
        index={index}
      >
        <DynamicComponent
          propValue={component.propValue}
          element={component}
          onInput={handleChange}
        />
      </Shape>
    );
  };

  const handleChange = (element: Component, value: string) => {
    console.log(element, value);
    updateComponentDataPropValue(element, value);
  };

  return (
    <div className="editor-container">
      {/* 画布区域 */}
      <div className="canvas-container">
        {componentData.map((component, index) => renderComponent(component, index))}
      </div>
    </div>
  );
};

export default Editor;