import React, { useEffect } from 'react';
import type { Component } from '@/stores/useEditorStore';
import LText from '@/components/LText';
import LButton from '@/components/LButton';
import LPicture from '@/components/LPicture';
import { useLayerStore } from '@/stores/useLayerStore';
import './index.scss';

// 组件映射表
const componentMap: Record<string, React.ComponentType<any>> = {
  'text': LText,
  'button': LButton,
  'picture': LPicture,
};

interface LGroupProps {
  propValue: Component[];
  element: Component;
  style?: React.CSSProperties;
  onInput?: (element: Component, value: string) => void;
}

// 递归渲染组件函数
const renderComponent = (component: Component, selectedComponentId?: string, onComponentClick?: (e: React.MouseEvent, component: Component) => void) => {
  // 对于组是特殊处理
  if (component.type === 'group' && Array.isArray(component.propValue)) {
    return (
      <div className="l-group-nested">
        {component.propValue.map((childComp) => {
          // 使用类型断言解决 groupStyle 不存在的 TS 错误
          const groupStyle = (childComp as any).groupStyle || {};
          
          return (
            <div
              key={childComp.id}
              className="l-group-item"
              style={{
                position: 'absolute',
                left: groupStyle.left || '0%',
                top: groupStyle.top || '0%',
                width: groupStyle.width || '100%',
                height: groupStyle.height || '100%',
                transform: groupStyle.rotate ? `rotate(${groupStyle.rotate}deg)` : undefined,
              }}
              onClick={(e) => onComponentClick && onComponentClick(e, childComp)}
            >
              {renderComponent(childComp, selectedComponentId, onComponentClick)}
            </div>
          );
        })}
      </div>
    );
  }
  
  // 非组，正常渲染
  const DynamicComponent = componentMap[component.type];
  if (!DynamicComponent) return null;
  
  return (
    <div 
      onClick={(e) => onComponentClick && onComponentClick(e, component)}
      className={`l-group-component ${component.id === selectedComponentId ? 'selected' : ''}`}
    >
      <DynamicComponent
        propValue={component.propValue}
        element={component}
        style={{}}
      />
    </div>
  );
};

const LGroup: React.FC<LGroupProps> = ({ propValue, element, style, onInput }) => {
  // 获取当前选中的组件和设置组件方法
  const setCurComponent = useLayerStore((state) => state.setCurComponent);
  const curComponent = useLayerStore((state) => state.curComponent);
  
  // 获取当前选中的组内组件ID
  const selectedComponentId = curComponent?.groupParentId === element.id ? curComponent?.id : undefined;
  
  // 打印选中的组件信息和组内所有组件信息，用于调试
  useEffect(() => {
    if (selectedComponentId) {
      console.log('Selected component in group:', selectedComponentId);
      console.log('Group components:', propValue);
      
      // 查找并输出选中组件的信息
      const selectedComponent = propValue.find(comp => comp.id === selectedComponentId);
      if (selectedComponent) {
        console.log('Selected component details:', selectedComponent);
        console.log('Selected component groupStyle:', (selectedComponent as any).groupStyle);
      }
    }
  }, [selectedComponentId, propValue]);
  
  // 处理子组件点击事件
  const handleComponentClick = (e: React.MouseEvent, component: Component) => {
    e.stopPropagation();
    
    // 获取组件的groupStyle，用于创建临时组件
    const groupStyle = (component as any).groupStyle || {};
    console.log('Clicked component groupStyle:', groupStyle);
    
    // 创建临时组件对象，保留组件内容但使用父组件的位置信息
    const tempComponent = {
      ...component,
      groupParentId: element.id, // 添加父组件ID以标识这是组内组件
      style: {
        ...component.style,
        // 添加groupStyle相关属性到style中，方便属性面板显示
        width: parseFloat(groupStyle.width || '100%'),
        height: parseFloat(groupStyle.height || '100%'),
      }
    };
    
    // 设置当前选中的组件为组内的子组件
    setCurComponent(tempComponent, -1);
    
    console.log('Group子组件被点击:', tempComponent.id, tempComponent.type, '临时组件数据:', tempComponent);
  };

  return (
    <div className="l-group" style={style}>
      <div className="l-group-container">
        {propValue.map(component => {
          // 使用类型断言解决 groupStyle 不存在的 TS 错误
          const groupStyle = (component as any).groupStyle || {};

          return (
            <div
              key={component.id}
              className="l-group-item"
              style={{
                position: 'absolute',
                left: groupStyle.left || '0%',
                top: groupStyle.top || '0%',
                width: groupStyle.width || '100%',
                height: groupStyle.height || '100%',
                transform: groupStyle.rotate ? `rotate(${groupStyle.rotate}deg)` : undefined,
              }}
            >
              {renderComponent(component, selectedComponentId, handleComponentClick)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LGroup; 