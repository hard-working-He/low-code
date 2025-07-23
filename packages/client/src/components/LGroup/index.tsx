import React from 'react';
import type { Component } from '@/stores/useEditorStore';
import LText from '@/components/LText';
import LButton from '@/components/LButton';
import LPicture from '@/components/LPicture';
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
}

const LGroup: React.FC<LGroupProps> = ({ propValue, element, style }) => {
  return (
    <div className="l-group" style={style}>
      <div className="l-group-container">
        {propValue.map(component => {
          const DynamicComponent = componentMap[component.type];
          if (!DynamicComponent) return null;
          
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
              <DynamicComponent
                propValue={component.propValue}
                element={component}
                style={{}}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LGroup; 