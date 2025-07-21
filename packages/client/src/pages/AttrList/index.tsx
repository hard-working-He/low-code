import React, { useState, useEffect } from 'react';
import { Form, Input, Select, ColorPicker, Typography, InputNumber } from 'antd';
import { useLayerStore } from '@/stores/useLayerStore';
import { useEditorStore } from '@/stores/useEditorStore';
import './index.scss';

const { Option } = Select;
const { Title } = Typography;

const AttrList: React.FC = () => {
  // Get the currently selected component from the LayerStore
  const curComponent = useLayerStore((state) => state.curComponent);
  const updateComponent = useEditorStore((state) => state.updateComponent);

  // State to track style properties
  const [styleKeys, setStyleKeys] = useState<string[]>([]);
  
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

  // Update styleKeys when curComponent changes
  useEffect(() => {
    if (curComponent && curComponent.style) {
      setStyleKeys(Object.keys(curComponent.style).filter(key => key in styleMap));
    } else {
      setStyleKeys([]);
    }
  }, [curComponent]);

  // Handle style property change
  const handleStyleChange = (key: string, value: any) => {
    if (!curComponent) return;
    
    updateComponent(curComponent.id, `style.${key}`, value);
  };

  // Handle propValue change
  const handlePropValueChange = (value: string) => {
    if (!curComponent) return;
    console.log('handlePropValueChange', curComponent.id, 'propValue', value);
    updateComponent(curComponent.id, 'propValue', value);
  };

  // Render nothing if no component is selected
  if (!curComponent) {
    return <div className="attr-list-empty">请选择一个组件</div>;
  }

  return (
    <div className="attr-list">
      <Title level={5}>组件属性</Title>
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
                value={curComponent.style[key]}
                onChange={(value) => handleStyleChange(key, value)}
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
