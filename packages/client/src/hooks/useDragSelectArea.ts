import { useRef, useCallback, useEffect } from 'react';
import { useComposeStore } from '@/stores';

export function useDragSelectArea(editorRef: React.RefObject<HTMLDivElement>) {
  // 拖拽状态
  const dragState = useRef({
    startX: 0,
    startY: 0,
    initialClientX: 0,
    initialClientY: 0,
    editorX: 0,
    editorY: 0,
  });

  // 事件处理器引用，避免重复绑定
  const eventHandlers = useRef({
    handleMouseMove: null as ((e: MouseEvent) => void) | null,
    handleMouseUp: null as (() => void) | null,
  });

  // RAF id 避免多次 requestAnimationFrame
  const rafId = useRef<number | null>(null);

  // store 操作
  const setShowArea = useComposeStore((state) => state.setShowArea);
  const setAreaSize = useComposeStore((state) => state.setAreaSize);
  const setStart = useComposeStore((state) => state.setStart);
  const createGroup = useComposeStore((state) => state.createGroup);

  // 清理事件监听
  const cleanupEventListeners = useCallback(() => {
    if (eventHandlers.current.handleMouseMove) {
      document.removeEventListener('mousemove', eventHandlers.current.handleMouseMove);
      eventHandlers.current.handleMouseMove = null;
    }
    if (eventHandlers.current.handleMouseUp) {
      document.removeEventListener('mouseup', eventHandlers.current.handleMouseUp);
      eventHandlers.current.handleMouseUp = null;
    }
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  // 卸载时清理
  useEffect(() => {
    return () => cleanupEventListeners();
  }, [cleanupEventListeners]);

  // 鼠标移动处理
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      const state = dragState.current;
      const newWidth = Math.abs(e.clientX - state.initialClientX);
      const newHeight = Math.abs(e.clientY - state.initialClientY);
      let newStartX = state.startX;
      let newStartY = state.startY;

      if (e.clientX < state.initialClientX) newStartX = e.clientX - state.editorX;
      if (e.clientY < state.initialClientY) newStartY = e.clientY - state.editorY;

      setStart(newStartX, newStartY);
      setAreaSize(newWidth, newHeight);
      useComposeStore.getState().setAreaData({
        style: {
          left: newStartX,
          top: newStartY,
          width: newWidth,
          height: newHeight,
        },
        components: [],
      });
    });
  }, [setStart, setAreaSize]);

  // 鼠标抬起
  const handleMouseUp = useCallback(() => {
    cleanupEventListeners();
    createGroup();

    // 等待 store 更新后再判断
    requestAnimationFrame(() => {
      const selected = useComposeStore.getState().getSelectArea();
      if (selected.length === 0) {
        useComposeStore.getState().hideArea();
      }
    });
  }, [cleanupEventListeners, createGroup]);

  // 鼠标按下
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== e.currentTarget) return;

      cleanupEventListeners();

      const rectInfo = editorRef.current?.getBoundingClientRect();
      if (!rectInfo) return;

      dragState.current = {
        startX: e.clientX - rectInfo.x,
        startY: e.clientY - rectInfo.y,
        initialClientX: e.clientX,
        initialClientY: e.clientY,
        editorX: rectInfo.x,
        editorY: rectInfo.y,
      };

      setShowArea(true);
      setAreaSize(0, 0);
      setStart(dragState.current.startX, dragState.current.startY);

      eventHandlers.current.handleMouseMove = handleMouseMove;
      eventHandlers.current.handleMouseUp = handleMouseUp;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [setShowArea, setAreaSize, setStart, handleMouseMove, handleMouseUp, cleanupEventListeners, editorRef]
  );

  return { handleMouseDown };
}
