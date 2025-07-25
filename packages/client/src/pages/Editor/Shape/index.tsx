import React, { useEffect, useRef, useState } from 'react';
import { useLayerStore } from '@/stores/useLayerStore';
import { useEditorStore } from '@/stores/useEditorStore';
import type { Component } from '@/stores/useEditorStore';
import { calculateComponentPositionAndSize } from '@/utils/computeXY';
import eventBus from '@/utils/eventBus';
import './index.scss';

// Rotation and resizing utilities
const mod360 = (deg: number) => {
  return (deg + 360) % 360;
};

// 组件属性定义
interface ShapeProps {
  active: boolean;
  element: Component;
  defaultStyle: any;
  index: number | string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  onPositionChange?: () => void;
}

// Shape组件实现
const Shape: React.FC<ShapeProps> = ({ 
  active, 
  element, 
  defaultStyle, 
  index, 
  children, 
  onClick,
  onPositionChange 
}) => {
  const [cursors, setCursors] = useState<Record<string, string>>({});
  const shapeRef = useRef<HTMLDivElement>(null);
  
  // Store states
  const setCurComponent = useLayerStore((state) => state.setCurComponent);
  const updateComponentPosition = useEditorStore((state) => state.updateComponentPosition);
  
  // Point lists for resizing handles
  const pointList = ['lt', 't', 'rt', 'r', 'rb', 'b', 'lb', 'l']; // 8 directions
  const pointList2 = ['r', 'l']; // left and right directions (for line components)
  
  // Initial angles for each point
  const initialAngle: Record<string, number> = {
    lt: 0,
    t: 45,
    rt: 90,
    r: 135,
    rb: 180,
    b: 225,
    lb: 270,
    l: 315,
  };
  
  // Angle ranges that map to cursor styles
  const angleToCursor = [
    { start: 338, end: 23, cursor: 'nw' },
    { start: 23, end: 68, cursor: 'n' },
    { start: 68, end: 113, cursor: 'ne' },
    { start: 113, end: 158, cursor: 'e' },
    { start: 158, end: 203, cursor: 'se' },
    { start: 203, end: 248, cursor: 's' },
    { start: 248, end: 293, cursor: 'sw' },
    { start: 293, end: 338, cursor: 'w' },
  ];

  // Helper to check if shape is active and not locked
  const isActive = () => {
    return active && !element.isLock;
  };

  // Get point list based on component type
  const getPointList = () => {
    return element.component === 'line-shape' ? pointList2 : pointList;
  };

  // Calculate cursor styles based on rotation
  const getCursor = () => {
    const rotate = mod360(defaultStyle.rotate || 0);
    const result: Record<string, string> = {};
    let lastMatchIndex = -1;

    getPointList().forEach(point => {
      const angle = mod360(initialAngle[point] + rotate);
      const len = angleToCursor.length;
      
      // Find matching cursor style based on angle
      while (true) {
        lastMatchIndex = (lastMatchIndex + 1) % len;
        const angleLimit = angleToCursor[lastMatchIndex];
        if (angle < 23 || angle >= 338) {
          result[point] = 'nw-resize';
          return;
        }

        if (angleLimit.start <= angle && angle < angleLimit.end) {
          result[point] = `${angleLimit.cursor}-resize`;
          return;
        }
      }
    });

    return result;
  };

  // Handle selection of current component
  const selectCurComponent = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Component selected:', element.id);
    
    // 如果组件有groupParentId属性，说明是通过点击组内子组件而设置的
    // 这种情况我们仍然保持当前选择，不再执行后续操作
    if (element.groupParentId) {
      console.log('Group child component already selected, not changing selection');
      if (onClick) {
        onClick(e);
      }
      return;
    }
    
    setCurComponent(element, Number(index));
    // Call the onClick prop if it exists
    if (onClick) {
      onClick(e);
    }
  };

  // 从useEditorStore导入拖拽标记函数
  const { startDrag, endDrag } = useEditorStore.getState();

  // Handle mouse down on shape (for dragging)
  const handleMouseDownOnShape = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Mouse down on shape:', element.id);
    
    if (element.isLock) return;
    
    // Set this as the current component
    setCurComponent(element, Number(index));
    setCursors(getCursor());
    
    const pos = { ...defaultStyle };
    const startY = e.clientY;
    const startX = e.clientX;
    const startTop = Number(pos.top || 0);
    const startLeft = Number(pos.left || 0);
    
    console.log('Start drag position:', { startX, startY, startTop, startLeft });
    
    // 标记开始拖拽，只记录初始状态
    startDrag();
    
    // Flag to track if element has moved
    let hasMove = false;
    let lastX = startX;
    let lastY = startY;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault(); // Prevent default to ensure drag works correctly
      
      hasMove = true;
      const curX = moveEvent.clientX;
      const curY = moveEvent.clientY;
      const newTop = curY - startY + startTop;
      const newLeft = curX - startX + startLeft;
      
      // 判断移动方向
      const isDownward = curY > lastY;
      const isRightward = curX > lastX;
      lastX = curX;
      lastY = curY;
      
      // 使用事件总线发送移动事件，替代DOM自定义事件
      // 发送移动事件，通知对齐线组件
      eventBus.emit('component:move', isDownward, isRightward);
      
      // 更新组件位置 - 直接更新，不依赖对齐线组件的返回值
      // 对齐线组件会在必要时自行调用updateComponentPosition
      updateComponentPosition(element.id, newLeft, newTop);
    };
    
    const handleMouseUp = () => {
      console.log('Mouse up, drag ended');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // 使用事件总线发送停止移动事件
      eventBus.emit('component:unmove');
      
      // 标记拖拽结束，记录最终状态
      if (hasMove) {
        endDrag();
      }
      
      // Call position change callback if provided and element has moved
      if (hasMove && onPositionChange) {
        onPositionChange();
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle rotation
  const handleRotate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Starting rotation');
    
    if (!shapeRef.current) return;
    
    const pos = { ...defaultStyle };
    const startY = e.clientY;
    const startX = e.clientX;
    const startRotate = pos.rotate || 0;
    
    // 标记开始拖拽旋转
    useEditorStore.getState().startDrag();
    
    // Get element center point
    const rect = shapeRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate rotation angle before movement
    const rotateDegreeBefore = Math.atan2(startY - centerY, startX - centerX) / (Math.PI / 180);
    
    let hasMove = false;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault(); // Prevent default to ensure rotation works correctly
      
      hasMove = true;
      const curX = moveEvent.clientX;
      const curY = moveEvent.clientY;
      
      // Calculate rotation angle after movement
      const rotateDegreeAfter = Math.atan2(curY - centerY, curX - centerX) / (Math.PI / 180);
      
      // Update rotation angle
      const newRotate = startRotate + rotateDegreeAfter - rotateDegreeBefore;
      
      console.log('Rotating to:', newRotate);
      
      // Update style with new rotation
      useEditorStore.getState().updateComponentPosition(
        element.id,
        pos.left,
        pos.top,
        { rotate: newRotate }
      );
    };
    
    const handleMouseUp = () => {
      console.log('Rotation ended');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setCursors(getCursor());
      
      // 标记拖拽旋转结束
      if (hasMove) {
        useEditorStore.getState().endDrag();
      }
      
      // Call position change callback if provided and element has moved
      if (hasMove && onPositionChange) {
        onPositionChange();
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Calculate style for each resize point
  const getPointStyle = (point: string) => {
    const pointStyle: React.CSSProperties = { 
      cursor: cursors[point]
    };
    
    const hasT = /t/.test(point);
    const hasB = /b/.test(point);
    const hasL = /l/.test(point);
    const hasR = /r/.test(point);
    
    // Position the resize points at the edges
    if (hasT) pointStyle.top = '-4px';
    if (hasB) pointStyle.bottom = '-4px';
    if (hasL) pointStyle.left = '-4px';
    if (hasR) pointStyle.right = '-4px';
    
    // Center points on edges
    if (point === 't' || point === 'b') pointStyle.left = 'calc(50% - 4px)';
    if (point === 'l' || point === 'r') pointStyle.top = 'calc(50% - 4px)';
    
    return pointStyle;
  };

  // Handle mouse down on resize points
  const handleMouseDownOnPoint = (point: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Starting resize from point:', point);
    
    if (!shapeRef.current) return;
    
    const style = { ...defaultStyle };
    
    // 标记开始拖拽调整大小
    useEditorStore.getState().startDrag();
    
    // Calculate proportions for aspect ratio
    const proportion = style.width / style.height;
    
    // Get component center point
    const center = {
      x: style.left + style.width / 2,
      y: style.top + style.height / 2,
    };
    
    // Get editor canvas position
    const editorElement = document.querySelector('.editor-container');
    const editorRect = editorElement?.getBoundingClientRect() || { left: 0, top: 0 };
    
    // Get point rect for accurate calculations
    const pointRect = e.currentTarget.getBoundingClientRect();
    
    // Current point coordinates relative to canvas
    const curPoint = {
      x: Math.round(pointRect.left - editorRect.left + 4), // Half of the point width (8px)
      y: Math.round(pointRect.top - editorRect.top + 4), // Half of the point height (8px)
    };
    
    // Calculate symmetric point (for maintaining center during resize)
    const symmetricPoint = {
      x: center.x - (curPoint.x - center.x),
      y: center.y - (curPoint.y - center.y),
    };
    
    let needSave = false;
    let isFirst = true;
    
    // Check if we need to maintain aspect ratio
    const needLockProportion = false;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault(); // Prevent default to ensure resize works correctly
      
      // Skip the first call to prevent jumps
      if (isFirst) {
        isFirst = false;
        return;
      }
      
      needSave = true;
      
      // Calculate cursor position relative to canvas
      const curPosition = {
        x: moveEvent.clientX - Math.round(editorRect.left),
        y: moveEvent.clientY - Math.round(editorRect.top),
      };
      
      // Calculate new size and position
      calculateComponentPositionAndSize(
        point,
        style,
        curPosition,
        proportion,
        needLockProportion,
        { center, curPoint, symmetricPoint }
      );
      
      console.log('Resizing to:', { width: style.width, height: style.height, left: style.left, top: style.top });
      
      // Update component style
      useEditorStore.getState().updateComponentPosition(
        element.id, 
        style.left, 
        style.top,
        { width: style.width, height: style.height }
      );
    };
    
    const handleMouseUp = () => {
      console.log('Resize ended');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // 标记拖拽调整大小结束
      if (needSave) {
        useEditorStore.getState().endDrag();
        console.log('已记录调整大小结束状态的快照');
      }
      
      needSave && console.log('Save component changes for undo/redo');
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Initialize cursor styles
  useEffect(() => {
    setCursors(getCursor());
  }, [defaultStyle.rotate]);
  
  return (
    <div
      ref={shapeRef}
      className={`shape ${active ? 'active' : ''} ${element.isLock ? 'locked' : ''}`}
      onClick={selectCurComponent}
      onMouseDown={handleMouseDownOnShape}
      style={{
        // Set position and dimensions directly from defaultStyle
        position: 'absolute',
        top: `${defaultStyle.top}px`,
        left: `${defaultStyle.left}px`,
        width: `${defaultStyle.width}px`,
        height: `${defaultStyle.height}px`,
        transform: defaultStyle.rotate ? `rotate(${defaultStyle.rotate}deg)` : undefined,
        zIndex: defaultStyle.zIndex || 1
      }}
    >
      {isActive() && (
        <span 
          className="iconfont icon-xiangyouxuanzhuan"
          onMouseDown={handleRotate}
        />
      )}
      {element.isLock && <span className="iconfont icon-suo" />}
      
      {isActive() && getPointList().map((item) => (
        <div
          key={item}
          className="shape-point"
          style={getPointStyle(item)}
          onMouseDown={(e) => handleMouseDownOnPoint(item, e)}
        />
      ))}
      
      {children}
    </div>
  );
};

export default Shape;
