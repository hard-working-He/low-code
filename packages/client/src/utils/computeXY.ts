/**
 * 计算鼠标位置相对于画布的坐标
 * @param clientX 鼠标相对于视口的X坐标
 * @param clientY 鼠标相对于视口的Y坐标
 * @param canvasElement 画布DOM元素
 * @returns 相对于画布的坐标，如果画布不存在则返回null
 */
function calculateRelativePosition(clientX: number, clientY: number, canvasElement: Element | null) {
    if (!canvasElement) return null;
    
    const canvasRect = canvasElement.getBoundingClientRect();
    return {
      x: clientX - canvasRect.x,
      y: clientY - canvasRect.y
    };
  }

  export default calculateRelativePosition