import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Select, ColorPicker, Typography, InputNumber } from 'antd';
import { useLayerStore } from '@/stores/useLayerStore';
import { useEditorStore } from '@/stores/useEditorStore';
import './index.scss';

const { Option } = Select;
const { Title } = Typography;

// 辅助函数：移除百分比符号并转换为数字
const percentToNumber = (value: string | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  // 如果是百分比字符串，移除%并转换为数字
  return parseFloat(value.toString().replace('%', ''));
};

const AttrList: React.FC = () => {
  // 从 LayerStore 获取当前选中的组件
  const curComponentFromLayer = useLayerStore((state) => state.curComponent);
  const componentData = useEditorStore((state) => state.componentData);
  const updateComponent = useEditorStore((state) => state.updateComponent);
  
  // 使用 ref 存储组件 ID，用于检测是否是同一个组件
  const curComponentIdRef = useRef<string | null>(null);
  
  // 直接从 EditorStore 获取最新的组件数据
  const curComponent = curComponentFromLayer?.id ? 
    componentData.find(c => c.id === curComponentFromLayer.id) || curComponentFromLayer :
    null;
    
  // 如果组件ID变了，就更新ref
  useEffect(() => {
    curComponentIdRef.current = curComponent?.id || null;
  }, [curComponent?.id]);

  // State to track style properties
  const [styleKeys, setStyleKeys] = useState<string[]>([]);
  const [groupChildStyle, setGroupChildStyle] = useState<any>({});
  
  // Map of style property keys to display names
  const styleMap: Record<string, string> = {
    width: '宽度',
    height: '高度',
    fontSize: '字体大小',
    fontWeight: '字体粗细',
    lineHeight: '行高',
    letterSpacing: '字间距',
    textAlign: '对齐方式',
    color: '字体颜色',
    backgroundColor: '背景色',
    borderWidth: '边框宽度',
    borderColor: '边框颜色',
    borderRadius: '圆角',
    padding: '内边距',
    top: '上边距',
    left: '左边距',
    rotate: '旋转角度',
  };

  // Alignment options for text
  const alignOptions = [
    { label: '左对齐', value: 'left' },
    { label: '居中', value: 'center' },
    { label: '右对齐', value: 'right' }
  ];

  // Components that don't have editable propValue content
  const excludes = ['picture'];

  // 获取组内组件的groupStyle
  useEffect(() => {
    if (!curComponent || !curComponent.groupParentId) return;
    
    // 查找父组
    const parentGroup = componentData.find(c => c.id === curComponent.groupParentId);
    if (!parentGroup || parentGroup.type !== 'group' || !Array.isArray(parentGroup.propValue)) return;
    
    // 查找组内当前选中的组件
    const childInGroup = parentGroup.propValue.find((c: any) => c.id === curComponent.id);
    if (!childInGroup) return;
    
    // 获取组件的groupStyle
    const groupStyle = (childInGroup as any).groupStyle || {};
    console.log('Found group child style:', groupStyle);
    
    // 更新到状态
    setGroupChildStyle(groupStyle);
  }, [curComponent, componentData]);

  // Update styleKeys when curComponent changes
  useEffect(() => {
    if (curComponent && curComponent.style) {
      setStyleKeys(Object.keys(curComponent.style).filter(key => key in styleMap));
    } else {
      setStyleKeys([]);
    }
  }, [curComponent]);

  // 更新组件内部的组内组件
  const updateGroupChildComponent = (parentId: string, childId: string, key: string, value: any) => {
    const parent = componentData.find(c => c.id === parentId);
    if (!parent || parent.type !== 'group' || !Array.isArray(parent.propValue)) return;
    
    const updatedPropValue = parent.propValue.map((child: any) => {
      if (child.id === childId) {
        if (key.startsWith('style.')) {
          const styleKey = key.split('.')[1];
          
          // 对于宽高和位置属性，需要更新groupStyle
          if (['width', 'height', 'left', 'top'].includes(styleKey)) {
            const updatedGroupStyle = { ...(child.groupStyle || {}) };
            
            if (styleKey === 'width' || styleKey === 'height') {
              // 宽高需要转为百分比存储
              updatedGroupStyle[styleKey] = `${value}%`;
            } else {
              updatedGroupStyle[styleKey] = value;
            }
            
            return {
              ...child,
              groupStyle: updatedGroupStyle
            };
          } else {
            // 其他样式属性直接更新style
            return {
              ...child,
              style: {
                ...child.style,
                [styleKey]: value
              }
            };
          }
        }
        return { ...child, [key]: value };
      }
      return child;
    });
    
    // 更新父组件的propValue
    updateComponent(parentId, 'propValue', updatedPropValue);
    console.log('Updated group child component:', childId, 'in group:', parentId, 'with key:', key, 'value:', value);
  };

  // Handle style property change
  const handleStyleChange = (key: string, value: any) => {
    if (!curComponent) return;
    
    console.log('handleStyleChange', key, value, '当前组件ID:', curComponent.id);
    
    // 如果是组内组件，需要特殊处理
    if (curComponent.groupParentId) {
      updateGroupChildComponent(curComponent.groupParentId, curComponent.id, `style.${key}`, value);
      
      // 更新本地状态，优化UI响应
      setGroupChildStyle((prev: Record<string, string | number>) => ({
        ...prev,
        [key]: key === 'width' || key === 'height' ? `${value}%` : value
      }));
    } else {
      updateComponent(curComponent.id, `style.${key}`, value);
    }
  };

  // Handle propValue change
  const handlePropValueChange = (value: string) => {
    if (!curComponent) return;
    console.log('handlePropValueChange', curComponent.id, 'propValue', value);
    
    // 如果是组内组件，需要特殊处理
    if (curComponent.groupParentId) {
      updateGroupChildComponent(curComponent.groupParentId, curComponent.id, 'propValue', value);
    } else {
      updateComponent(curComponent.id, 'propValue', value);
    }
  };

  // 获取样式值（处理组内组件特殊情况）
  const getStyleValue = (key: string) => {
    if (!curComponent) return 0;
    
    // 如果是组内组件，先尝试从groupStyle中获取
    if (curComponent.groupParentId) {
      // 对于宽高和位置属性，从groupStyle中获取
      if (['width', 'height', 'top', 'left'].includes(key)) {
        const value = groupChildStyle[key];
        
        if (value !== undefined) {
          // 宽高可能是百分比字符串
          return percentToNumber(value);
        }
      }
    }
    
    // 否则或没有groupStyle值时从组件style中获取
    return curComponent.style[key] || 0;
  };

  // Render nothing if no component is selected
  if (!curComponent) {
    return <div className="attr-list-empty">请选择一个组件</div>;
  }

  // 如果是组内组件，显示提示信息
  const isGroupChild = !!curComponent.groupParentId;

  return (
    <div className="attr-list">
      <Title level={5}>
        {isGroupChild ? `组内${curComponent.type}组件属性` : '组件属性'}
      </Title>
      <Form layout="vertical">
        {styleKeys.map((key) => (
          <Form.Item key={key} label={styleMap[key] || key}>
            {key === 'color' || key === 'backgroundColor' || key === 'borderColor' ? (
              <ColorPicker
                value={curComponent.style[key]}
                onChange={(color) => handleStyleChange(key, color.toHexString())}
              />
            ) : key === 'textAlign' ? (
              <Select
                value={curComponent.style[key] || 'left'}
                onChange={(value) => handleStyleChange(key, value)}
              >
                {alignOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            ) : (
              <InputNumber
                value={getStyleValue(key)}
                onChange={(value) => value !== null && handleStyleChange(key, value)}
                style={{ width: '100%' }}
              />
            )}
          </Form.Item>
        ))}

        {curComponent.propValue !== undefined && 
         typeof curComponent.propValue === 'string' && 
         !excludes.includes(curComponent.type) && (
          <Form.Item label="内容">
            <Input.TextArea
              value={curComponent.propValue}
              onChange={(e) => handlePropValueChange(e.target.value)}
              rows={4}
            />
          </Form.Item>
        )}
      </Form>
    </div>
  );
};

export default AttrList;
