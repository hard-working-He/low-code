import React from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import type { Component } from '@/stores/useEditorStore';
import LText from '@/components/LText';
import './index.scss';

// 组件映射表
const componentMap: Record<string, React.ComponentType<any>> = {
  'text': LText,
  // 可以添加更多组件映射
  // 'LButton': LButton,
  // 'LPicture': LPicture,
};

const Editor: React.FC = () => {
  // 从 store 中获取组件数据
  const componentData = useEditorStore((state) => state.componentData);
  const updateComponentDataPropValue = useEditorStore((state) => state.updateComponentDataPropValue);
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
        style={{
          position: 'absolute',
          ...component.style
        }}
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

  const handleAddComponent = () => {
    addComponent({
      id: '3',
      type: 'text',
      propValue: '333',
      style: {
        top: 200,
        left: 200,
        width: 100,
        height: 100,
        zIndex: 3,
      },
    });
    addComponent({
      id: '4',
        type: 'text',
        propValue: '444',
        style: {
          top: 300,
          left: 300,
          width: 100,
          height: 100,
          zIndex: 4,
        },
    });
  };
  
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