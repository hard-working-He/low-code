import React, { useEffect, useCallback, useMemo } from 'react';
import { useEditorStore, useLayerStore, useSnapShotStore, useAppStore } from '@/stores';
import { setDefaultComponentData } from '@/stores/useSnapShotStore';
import type { Component } from '@/stores/useEditorStore';
import LText from '@/components/LText';
import LButton from '@/components/LButton';
import LPicture from '@/components/LPicture';
import Shape from './Shape';
import MarkLine from './MarkLine';
import { throttle } from '@/utils/throttle'; 
import './index.scss';

// 组件映射表 - 移到组件外部避免重新创建
const componentMap: Record<string, React.ComponentType<any>> = {
  'text': LText,
  'button': LButton,
  'picture': LPicture,
};

const Editor: React.FC = () => {
  // 从 store 中获取组件数据
  const componentData = useEditorStore((state) => state.componentData);
  const updateComponentDataPropValue = useEditorStore((state) => state.updateComponentDataPropValue);
  const canvasStyleData = useAppStore((state) => state.canvasStyleData);
  // 从 LayerStore 中获取当前选中组件
  const curComponent = useLayerStore((state) => state.curComponent);
  const topComponent = useLayerStore((state) => state.topComponent);
  const setCurComponent = useLayerStore((state) => state.setCurComponent);

  // 从 SnapshotStore 中获取快照相关函数
  const recordSnapshot = useSnapShotStore((state) => state.recordSnapshot);
  
  // 使用 useCallback 优化节流记录快照函数
  const throttledRecordSnapshot = useCallback(
    throttle(() => recordSnapshot(), 16),
    [recordSnapshot]
  );
  
  // 初始化快照 - 添加正确的依赖项
  useEffect(() => {
    console.log('Editor mounted, initializing snapshot with:', componentData);
    
    if (componentData.length > 0) {
      // 设置默认组件数据
      setDefaultComponentData([...componentData]);
      
      // 延迟一下再记录快照，确保默认数据已经设置好
      setTimeout(() => {
        recordSnapshot();
        console.log('Initial snapshot recorded');
      },100);
    }
  }, [componentData, recordSnapshot]); // 添加正确的依赖项

  // 使用 useCallback 优化处理组件位置变化
  const handlePositionChange = useCallback(() => {
    throttledRecordSnapshot();
  }, [throttledRecordSnapshot]);
  
  // 使用 useCallback 优化组件点击处理
  const handleShapeClick = useCallback((component: Component, index: number) => {
    console.log('component被点击', component, 'index是', index);
    setCurComponent(component, index);
    topComponent();
  }, [setCurComponent, topComponent]);

  // 使用 useCallback 优化组件内容变化处理
  const handleChange = useCallback((element: Component, value: string) => {
    console.log('Component content changed:', element, value);
    updateComponentDataPropValue(element, value);
    // 使用节流函数防止过于频繁的记录快照
    throttledRecordSnapshot();
  }, [updateComponentDataPropValue, throttledRecordSnapshot]);
  
  // 渲染每个组件
  const renderComponent = useCallback((component: Component, index: number) => {
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
        onClick={() => handleShapeClick(component, index)}
        onPositionChange={handlePositionChange}
      >
        <DynamicComponent
          propValue={component.propValue}
          element={component}
          onInput={handleChange}
          style={{
            zIndex: component.index,
          }}
        />
      </Shape>
    );
  }, [curComponent, handlePositionChange, handleChange, handleShapeClick]);

  // 使用 useMemo 优化组件列表渲染
  const renderedComponents = useMemo(() => {
    return componentData.map((component, index) => 
      renderComponent(component, index)
    );
  }, [componentData, renderComponent]);

  return (
    <div className="editor-container">
      <div className="editor">
        <div 
          className="draw-panel" 
          style={{ 
            position: 'relative',
            backgroundColor: canvasStyleData.backgroundColor, 
            opacity: canvasStyleData.opacity,
            color: canvasStyleData.color,
            fontSize: canvasStyleData.fontSize
          }}
        >
          <div 
            className="content"
            style={{
              position: 'relative',
              width: '100%',
              height: '100%'
            }}
          >
            {/* 使用优化后的组件渲染列表 */}
            {renderedComponents}
            
            {/* 渲染对齐线 - 只渲染一次 */}
            <MarkLine />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;