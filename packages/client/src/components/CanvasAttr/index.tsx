import React from 'react';
import { Form, Input } from 'antd';
import { ColorPicker } from 'antd';
import './index.scss';

interface CanvasStyleData {
  color: string;
  opacity: number;
  backgroundColor: string;
  fontSize: number;
}

interface CanvasAttrProps {
  canvasStyleData: CanvasStyleData;
  updateCanvasStyleData: (key: keyof CanvasStyleData, value: string | number) => void;
}

const CanvasAttr: React.FC<CanvasAttrProps> = ({ canvasStyleData, updateCanvasStyleData }) => {
  const options = {
    color: '颜色',
    opacity: '不透明度',
    backgroundColor: '背景色',
    fontSize: '字体大小',
  };

  const isIncludesColor = (str: string) => {
    return str.toLowerCase().includes('color');
  };

  return (
    <div className="attr-container">
      <p className="title">画布属性</p>
      <Form style={{ padding: '20px' }}>
        {Object.keys(options).map((key, index) => (
          <Form.Item key={index} label={options[key as keyof typeof options]}>
            {isIncludesColor(key) ? (
              <ColorPicker
                value={canvasStyleData[key as keyof CanvasStyleData] as string}
                onChange={(_color, hex) => updateCanvasStyleData(key as keyof CanvasStyleData, hex)}
              />
            ) : (
              <Input
                type="number"
                value={canvasStyleData[key as keyof CanvasStyleData]}
                onChange={(e) => updateCanvasStyleData(key as keyof CanvasStyleData, Number(e.target.value))}
              />
            )}
          </Form.Item>
        ))}
      </Form>
    </div>
  );
};

export default CanvasAttr;