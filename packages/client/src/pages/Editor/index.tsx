import React, { useEffect } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { useLayerStore } from '@/stores/useLayerStore';
import { useSnapShotStore } from '@/stores';
import { setDefaultComponentData } from '@/stores/useSnapShotStore';
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
  const upComponent=useLayerStore((state)=>state.upComponent);
  const downComponent=useLayerStore((state)=>state.downComponent);
  const topComponent=useLayerStore((state)=>state.topComponent);
  const bottomComponent=useLayerStore((state)=>state.bottomComponent);
  const setCurComponent=useLayerStore((state)=>state.setCurComponent);
  const setComponentData=useLayerStore((state)=>state.setComponentData);
  const getComponentData=useLayerStore((state)=>state.getComponentData);

  // 从 SnapshotStore 中获取快照相关函数
  const recordSnapshot = useSnapShotStore((state) => state.recordSnapshot);
  const snapshotData=useSnapShotStore((state) => state.snapshotData);
  const snapshotIndex=useSnapShotStore((state) => state.snapshotIndex);
  // 初始化快照 - 使用useEffect确保只在组件挂载时执行一次
  useEffect(() => {
    console.log('Editor mounted, initializing snapshot with:', componentData);
    
    if (componentData.length > 0) {
      // 设置默认组件数据
      setDefaultComponentData([...componentData]);
      
      // 延迟一下再记录快照，确保默认数据已经设置好
      setTimeout(() => {
        recordSnapshot();
        console.log('Initial snapshot recorded');
      }, 100);
    }
  }, []); // 空依赖数组确保只在组件挂载时执行一次
  
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
    
    const handleClick=()=>{
      console.log('component被点击',component,'index是',index);
      setCurComponent(component,index);
      topComponent();
    }
    return (
      <Shape
        key={component.id}
        active={isActive}
        element={component}
        defaultStyle={component.style}
        index={index}
        onClick={handleClick}
        onPositionChange={handlePositionChange}
      >
        <DynamicComponent
          propValue={component.propValue}
          element={component}
          onInput={handleChange}
          style={{
            zIndex:component.index,
          }}
        />
      </Shape>
    );
  };

  // 处理组件内容变化
  const handleChange = (element: Component, value: string) => {
    console.log('Component content changed:', element, value);
    updateComponentDataPropValue(element, value);
    // 使用节流函数防止过于频繁的记录快照
    throttledRecordSnapshot();
  };
  
  // 处理组件位置变化
  const handlePositionChange = () => {
    console.log('Component position changed');
    // 使用节流函数防止过于频繁的记录快照
    throttledRecordSnapshot();
  };
  
  // 使用节流函数优化快照记录
  const throttledRecordSnapshot = throttle(() => {
    console.log('Recording snapshot after change');
    recordSnapshot();
  }, 1000);

  return (
    <div className="editor-container">
      {/* 画布区域 */}
      <div className="canvas-container">
        { snapshotData.length > 0 && snapshotData[snapshotIndex].map((component, index) => renderComponent(component, index))}
      </div>
    </div>
  );
};

export default Editor;