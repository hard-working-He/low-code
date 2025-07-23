import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { useEditorStore, useLayerStore, useSnapShotStore, useAppStore, useComposeStore } from '@/stores';
import { setDefaultComponentData } from '@/stores/useSnapShotStore';
import type { Component } from '@/stores/useEditorStore';
import LText from '@/components/LText';
import LButton from '@/components/LButton';
import LPicture from '@/components/LPicture';
import LGroup from '@/components/LGroup';
import Shape from './Shape';
import MarkLine from './MarkLine';
import { throttle } from '@/utils/throttle'; 
import './index.scss';

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

  // 从 SnapshotStore 中获取快照相关函数
  const recordSnapshot = useSnapShotStore((state) => state.recordSnapshot);
  
  // 从 ComposeStore 中获取选区相关函数
  const isShowArea = useComposeStore((state) => state.isShowArea);
  const areaData = useComposeStore((state) => state.areaData);
  const setShowArea = useComposeStore((state) => state.setShowArea);
  const setStart = useComposeStore((state) => state.setStart);
  const setAreaSize = useComposeStore((state) => state.setAreaSize);
  const getEditor = useComposeStore((state) => state.getEditor);
  const createGroup = useComposeStore((state) => state.createGroup);
  // 获取选区的起始点和尺寸
  const start = useComposeStore((state) => state.start);
  const width = useComposeStore((state) => state.width);
  const height = useComposeStore((state) => state.height);
  
  // 编辑器引用
  const editorRef = useRef<HTMLDivElement>(null);
  
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
      
      // 检查是否已有快照记录，如果没有才记录初始快照
      const snapshotData = useSnapShotStore.getState().snapshotData;
      if (snapshotData.length === 0) {
        // 延迟一下再记录快照，确保默认数据已经设置好
        setTimeout(() => {
          recordSnapshot();
          console.log('Initial snapshot recorded');
        }, 100);
      } else {
        console.log('Snapshots already exist, skipping initial recording');
      }
    }
    
    // 初始化编辑器引用
    getEditor();
  }, []); // 只在组件挂载时运行一次

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

  // 处理画布点击 - 清除当前选中组件
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // 检查点击的是否是画布本身而不是组件
    if (e.target === e.currentTarget) {
      console.log('点击了画布空白区域，取消选中组件');
      setCurComponent(null, -1);
    }
  }, [setCurComponent]);

  // 使用 useCallback 优化组件内容变化处理
  const handleChange = useCallback((element: Component, value: string) => {
    console.log('Component content changed:', element, value);
    updateComponentDataPropValue(element, value);
    // 使用节流函数防止过于频繁的记录快照
    throttledRecordSnapshot();
  }, [updateComponentDataPropValue, throttledRecordSnapshot]);
  
  // 鼠标按下事件处理函数 - 开始选择区域
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 如果点击的不是画布本身，则不处理
    if (e.target !== e.currentTarget) return;
    
    // 获取编辑器的位移信息
    const rectInfo = editorRef.current?.getBoundingClientRect();
    if (!rectInfo) return;
    
    const editorX = rectInfo.x;
    const editorY = rectInfo.y;
    
    // 记录起点坐标
    const startX = e.clientX - editorX;
    const startY = e.clientY - editorY;
    setStart(startX, startY);
    
    // 显示选择区域
    setShowArea(true);
    setAreaSize(0, 0);
    
    // 监听鼠标移动和抬起事件
    const handleMouseMove = (moveEvent: MouseEvent) => {
      let newWidth = Math.abs(moveEvent.clientX - e.clientX);
      let newHeight = Math.abs(moveEvent.clientY - e.clientY);
      
      let newStartX = startX;
      let newStartY = startY;
      
      // 处理向左上方拖动的情况
      if (moveEvent.clientX < e.clientX) {
        newStartX = moveEvent.clientX - editorX;
      }
      
      if (moveEvent.clientY < e.clientY) {
        newStartY = moveEvent.clientY - editorY;
      }
      
      // 更新起点和区域大小
      setStart(newStartX, newStartY);
      setAreaSize(newWidth, newHeight);
      
      // 同时更新areaData以实时显示拖拽区域
      useComposeStore.getState().setAreaData({
        style: {
          left: newStartX,
          top: newStartY,
          width: newWidth,
          height: newHeight
        },
        components: []
      });
    };
    
    const handleMouseUp = () => {
      // 创建组合区域
      createGroup();
      
      // 检查选区是否有组件
      const selectedComponents = useComposeStore.getState().getSelectArea();
      if (selectedComponents.length === 0) {
        // 如果没有组件在选区内，则隐藏选区
        useComposeStore.getState().hideArea();
      }
      
      // 移除事件监听
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // 添加事件监听
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [setStart, setShowArea, setAreaSize, createGroup]);
  
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
      <div className="editor" id="editor" ref={editorRef}>
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
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
          >
            {/* 使用优化后的组件渲染列表 */}
            {renderedComponents}
            
            {/* 渲染对齐线 - 只渲染一次 */}
            <MarkLine />
            
            {/* 渲染选择区域 */}
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
        </div>
      </div>
    </div>
  );
};

export default Editor;