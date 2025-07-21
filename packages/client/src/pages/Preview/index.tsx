import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { useEditorStore, useAppStore } from '@/stores';
import { deepCopy } from '@/utils/utils';
import type { Component } from '@/stores/useEditorStore';
import LText from '@/components/LText';
import LButton from '@/components/LButton';
import LPicture from '@/components/LPicture';
import toast from '@/utils/toast';
import { toPng } from 'html-to-image';
import './index.scss';

// Component mapping table - moved outside to prevent recreation
const componentMap: Record<string, React.ComponentType<any>> = {
  'text': LText,
  'button': LButton,
  'picture': LPicture,
};

interface PreviewProps {
  isScreenshot?: boolean;
  onClose?: () => void;
}

const Preview: React.FC<PreviewProps> = ({ isScreenshot = false, onClose }) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Get component data from store
  const componentData = useEditorStore((state) => state.componentData);
  const canvasStyleData = useAppStore((state) => state.canvasStyleData);
  
  // Deep copy of componentData to avoid modifications affecting the editor
  const [copyData] = useState(() => deepCopy(componentData));
  
  // Render each component without Shape wrapper
  const renderComponent = (component: Component, index: number) => {
    // Check if component type is undefined or not registered
    if (!component.type) {
      console.warn(`Component with ID "${component.id}" has undefined type`);
      return null;
    }
    
    const DynamicComponent = componentMap[component.type];
    
    // If component type is not found, return null
    if (!DynamicComponent) {
      console.warn(`Component type "${component.type}" not registered`);
      return null;
    }
    
    // Get component style from the style object
    const componentStyle: React.CSSProperties = {
      position: 'absolute',
      top: `${component.style.top}px`,
      left: `${component.style.left}px`,
      width: `${component.style.width}px`,
      height: `${component.style.height}px`,
      transform: component.style.rotate ? `rotate(${component.style.rotate}deg)` : undefined,
      zIndex: index
    };

    return (
      <div 
        key={component.id}
        style={componentStyle}
      >
        <DynamicComponent
          propValue={component.propValue}
          element={component}
          style={{}}
        />
      </div>
    );
  };

  // Optimize component list rendering with useMemo
  const renderedComponents = useMemo(() => {
    return copyData.map((component, index) => 
      renderComponent(component, index)
    );
  }, [copyData]);

  // Handle close button click
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  // Handle screenshot
  const handleScreenshot = () => {
    if (!canvasRef.current) {
      toast('截图失败：无法获取画布元素', 'error');
      return;
    }
    
    setIsCapturing(true);
    
    // Configure the options for html-to-image to handle CORS issues
    const options = {
      cacheBust: true,
      imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdgJCU1CbeQAAAABJRU5ErkJggg==',
      skipAutoScale: true,
      quality: 1.0,
      pixelRatio: 1,
      backgroundColor: '#ffffff'
    };
    
    toPng(canvasRef.current, options)
      .then((dataUrl) => {
        // Create a download link
        const link = document.createElement('a');
        link.download = `low-code-screenshot-${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
        
        toast('截图已保存', 'success');
        
        // Close the preview after successful capture
        setTimeout(() => {
          handleClose();
        }, 500);
      })
      .catch((error) => {
        console.error('Screenshot failed:', error);
        toast('截图失败：' + error.message, 'error');
      })
      .finally(() => {
        setIsCapturing(false);
      });
  };

  // Get canvas style
  const getCanvasStyle = (): React.CSSProperties => {
    return {
      backgroundColor: canvasStyleData.backgroundColor || '#ffffff',
      opacity: canvasStyleData.opacity / 100 || 1, // Convert percentage to decimal
      color: canvasStyleData.color || '#000000',
      fontSize: `${canvasStyleData.fontSize || 14}px`,
      position: 'relative',
      margin: 'auto',
      width: '1200px', // Default canvas width
      height: '740px', // Default canvas height
    };
  };

  return (
    <div ref={containerRef} className="preview-bg">
      <Button 
        className="close-button" 
        onClick={isScreenshot ? handleScreenshot : handleClose}
        loading={isCapturing}
      >
        {isScreenshot ? (isCapturing ? '生成中...' : '生成截图') : '关闭'}
      </Button>
      
      <div className="canvas-container">
        <div ref={canvasRef} className="canvas" style={getCanvasStyle()}>
          {renderedComponents}
        </div>
      </div>
    </div>
  );
};

export default Preview;
