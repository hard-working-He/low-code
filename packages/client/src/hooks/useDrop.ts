import { useCallback, useState } from 'react';

interface UseDropOptions {
  onDrop?: (data: any, e: React.DragEvent<HTMLElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLElement>) => void;
  onDragEnter?: (e: React.DragEvent<HTMLElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLElement>) => void;
  acceptTypes?: string[];
}

/**
 * 自定义Hook，用于处理拖拽目标元素
 * @param options 放置选项，包括回调函数和允许的数据类型
 * @returns 返回拖拽目标属性、状态和处理函数
 */
export function useDrop(options: UseDropOptions = {}) {
  const { 
    onDrop, 
    onDragOver, 
    onDragEnter, 
    onDragLeave, 
    acceptTypes = ['custom-drag', 'text/plain'] 
  } = options;
  
  const [isOver, setIsOver] = useState(false);
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsOver(true);
    
    if (onDragEnter) {
      onDragEnter(e);
    }
    
    console.log('Drag entered drop target');
  }, [onDragEnter]);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsOver(false);
    
    if (onDragLeave) {
      onDragLeave(e);
    }
    
    console.log('Drag left drop target');
  }, [onDragLeave]);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); // 非常重要，允许放置
    
    // 检查是否是接受的类型
    const isAccepted = acceptTypes.some(type => 
      e.dataTransfer.types.includes(type)
    );
    
    if (isAccepted) {
      e.dataTransfer.dropEffect = 'copy';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
    
    if (onDragOver) {
      onDragOver(e);
    }
  }, [acceptTypes, onDragOver]);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsOver(false);
    
    // 尝试从多种格式中获取数据
    let data = null;
    for (const type of acceptTypes) {
      try {
        const rawData = e.dataTransfer.getData(type);
        if (rawData) {
          data = JSON.parse(rawData);
          break;
        }
      } catch (error) {
        console.error(`Error parsing ${type} data:`, error);
      }
    }
    
    // 如果没有找到数据，尝试使用text/plain
    if (!data) {
      try {
        const plainText = e.dataTransfer.getData('text/plain');
        if (plainText) {
          data = plainText;
        }
      } catch (error) {
        console.error('Error parsing text/plain data:', error);
      }
    }
    
    console.log('Dropped data:', data);
    console.log('Available data types:', e.dataTransfer.types);
    
    if (onDrop && data) {
      onDrop(data, e);
    }
  }, [acceptTypes, onDrop]);
  
  // 返回拖拽目标属性和状态
  return {
    dropProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    isOver,
  };
} 