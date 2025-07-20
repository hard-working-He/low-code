import { useCallback } from 'react';

interface UseDragOptions {
  type?: string;
  data: any;
  onDragStart?: (e: React.DragEvent<HTMLElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLElement>) => void;
}

/**
 * 自定义Hook，用于处理拖拽源元素
 * @param options 拖拽选项，包括拖拽数据和回调函数
 * @returns 返回拖拽属性和处理函数
 */
export function useDrag(options: UseDragOptions) {
  const { type = 'custom-drag', data, onDragStart, onDragEnd } = options;
  
  const handleDragStart = useCallback((e: React.DragEvent<HTMLElement>) => {
    // 设置拖拽数据 - 使用多种格式提高兼容性
    e.dataTransfer.setData('text/plain', JSON.stringify(data));
    e.dataTransfer.setData(type, JSON.stringify(data));
    
    // 设置拖拽效果
    e.dataTransfer.effectAllowed = 'copy';
    
    // 可选：设置拖拽图像
    // const element = e.currentTarget;
    // const rect = element.getBoundingClientRect();
    // e.dataTransfer.setDragImage(element, rect.width / 2, rect.height / 2);
    
    // 调用外部提供的onDragStart回调
    if (onDragStart) {
      onDragStart(e);
    }
    
    console.log('Drag started with data:', data);
  }, [data, type, onDragStart]);
  
  const handleDragEnd = useCallback((e: React.DragEvent<HTMLElement>) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
    console.log('Drag ended');
  }, [onDragEnd]);
  
  // 返回拖拽属性和处理函数
  return {
    dragProps: {
      draggable: true,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
    },
  };
} 