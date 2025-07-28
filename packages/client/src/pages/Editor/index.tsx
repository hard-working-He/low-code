import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { useEditorStore, useLayerStore, useSnapShotStore, useAppStore, useComposeStore } from '@/stores';
import { setDefaultComponentData } from '@/stores/useSnapShotStore';
import type { Component } from '@/stores/useEditorStore';
import LText from '@/components/LText';
import LButton from '@/components/LButton';
import LPicture from '@/components/LPicture';
import LGroup from '@/components/LGroup';
import Shape from './Shape';
import './index.scss';
import { useDragSelectArea } from '@/hooks/useDragSelectArea';

// 组件映射表 - 移到组件外部避免重新创建
const componentMap: Record<string, React.ComponentType<any>> = {
  'text': LText,
  'button': LButton,
  'picture': LPicture,
  'group': LGroup,
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

  // 从 ComposeStore 中获取选区相关函数
  const isShowArea = useComposeStore((state) => state.isShowArea);
  const areaData = useComposeStore((state) => state.areaData);
  const getEditor = useComposeStore((state) => state.getEditor);
  // 获取选区的起始点和尺寸
  const start = useComposeStore((state) => state.start);
  const width = useComposeStore((state) => state.width);
  const height = useComposeStore((state) => state.height);
  
  // 编辑器引用
  const editorRef = useRef<HTMLDivElement>(null);

  // 使用拖拽选区 hook
  const { handleMouseDown } = useDragSelectArea(editorRef as React.RefObject<HTMLDivElement>);
  
  // 跟踪初始化状态，防止StrictMode下重复初始化
  const hasInitialized = useRef(false);

  
  // 初始化快照 - 添加正确的依赖项
  useEffect(() => {
    if (componentData.length > 0 && !hasInitialized.current) {
      try {
        setDefaultComponentData([...componentData]);
        const snapshots = useSnapShotStore.getState().snapshots;
        if (snapshots.length === 0) {
          const initTimer = setTimeout(() => {
            try {
              useSnapShotStore.getState().recordSnapshot();
            } catch (error) {
              console.error('Failed to record initial snapshot:', error);
            } finally {
              hasInitialized.current = true;
            }
          }, 100);
          return () => clearTimeout(initTimer);
        } else {
          hasInitialized.current = true;
        }
      } catch (error) {
        console.error('Error during editor initialization:', error);
        hasInitialized.current = true;
      }
    }
    getEditor();
  }, []);

  // 组件点击处理
  const handleShapeClick = useCallback((component: Component, index: number) => {
    setCurComponent(component, index);
    topComponent();
  }, [setCurComponent, topComponent]);

  // 画布点击 - 清除当前选中组件
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setCurComponent(null, -1);
    }
  }, [setCurComponent]);
  
  // 组件内容变化处理
  const handleChange = useCallback((element: Component, value: string) => {
    updateComponentDataPropValue(element, value);
  }, [updateComponentDataPropValue]);
  
  // 渲染每个组件
  const renderComponent = useCallback((component: Component, index: number) => {
    const DynamicComponent = componentMap[component.type];
    if (!DynamicComponent) return null;
    const isActive = curComponent?.id === component.id;
    return (
      <Shape
        key={component.id}
        active={isActive}
        element={component}
        defaultStyle={component.style}
        index={index}
        onClick={() => handleShapeClick(component, index)}
      >
        <DynamicComponent
          propValue={component.propValue}
          element={component}
          onInput={handleChange}
          style={{ zIndex: component.index }}
        />
      </Shape>
    );
  }, [curComponent, handleShapeClick, handleChange]);

  // 组件列表渲染
  const renderedComponents = useMemo(() => {
    return componentData.map((component, index) => 
      renderComponent(component, index)
    );
  }, [componentData, renderComponent]);

  return (
    <div 
      className="editor-container"
      id="editor" 
      ref={editorRef}
      style={{ 
        position: 'relative',
        backgroundColor: canvasStyleData.backgroundColor, 
        opacity: canvasStyleData.opacity,
        color: canvasStyleData.color,
        fontSize: canvasStyleData.fontSize,
        width: '100%',
        height: '100%'
      }}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
    >
      {renderedComponents}
      {isShowArea && (
        <div 
          className="select-area"
          style={{
            position: 'absolute',
            border: '1px dashed #59c7f9',
            backgroundColor: 'rgba(89, 199, 249, 0.1)',
            left: `${areaData.style.left || start.x}px`,
            top: `${areaData.style.top || start.y}px`,
            width: `${areaData.style.width || width}px`,
            height: `${areaData.style.height || height}px`,
            zIndex: 9999,
          }}
        />
      )}
    </div>
  );
};

export default Editor;