/**
 * 计算元素相对于画布的坐标
 * @param clientX - 鼠标的客户端X坐标
 * @param clientY - 鼠标的客户端Y坐标
 * @param canvasElement - 画布DOM元素
 * @returns 如果画布存在，返回相对坐标，否则返回null
 */
export default function calculateRelativePosition(clientX: number, clientY: number, canvasElement: Element | null): { x: number, y: number } | null {
    if (!canvasElement) return null;
    
    // 获取画布的位置信息
    const canvasRect = canvasElement.getBoundingClientRect();
    
    // 计算相对于画布左上角的坐标
    const x = clientX - canvasRect.left;
    const y = clientY - canvasRect.top;
    
    return { x, y };
}

/**
 * 计算组件在调整大小过程中的位置和尺寸
 * @param point - 拖动的点的标识（如lt, t, rt等）
 * @param style - 组件当前的样式
 * @param curPosition - 当前鼠标位置
 * @param proportion - 宽高比例
 * @param needLockProportion - 是否需要锁定比例
 * @param params - 其他参数（中心点、当前点、对称点）
 */
export function calculateComponentPositionAndSize(
  point: string,
  style: any,
  curPosition: { x: number, y: number },
  proportion: number,
  needLockProportion: boolean,
  params: {
    center: { x: number, y: number },
    curPoint: { x: number, y: number },
    symmetricPoint: { x: number, y: number }
  }
) {
  const { center } = params;
  const hasT = /t/.test(point);
  const hasB = /b/.test(point);
  const hasL = /l/.test(point);
  const hasR = /r/.test(point);
  
  // 设置最小宽高
  const minWidth = 20;
  const minHeight = 20;
  
  let newWidth = style.width;
  let newHeight = style.height;
  
  // 根据不同的控制点计算新的宽高
  if (hasL || hasR) {
    // 处理左右两侧的拉伸
    newWidth = hasL
      ? Math.max(center.x - curPosition.x, minWidth / 2) * 2
      : Math.max(curPosition.x - center.x, minWidth / 2) * 2;
  }
  
  if (hasT || hasB) {
    // 处理上下两侧的拉伸
    newHeight = hasT
      ? Math.max(center.y - curPosition.y, minHeight / 2) * 2
      : Math.max(curPosition.y - center.y, minHeight / 2) * 2;
  }
  
  // 如果需要锁定比例
  if (needLockProportion) {
    if ((hasL || hasR) && !hasT && !hasB) {
      // 仅水平拉伸时，根据宽度计算高度
      newHeight = newWidth / proportion;
    } else if ((hasT || hasB) && !hasL && !hasR) {
      // 仅垂直拉伸时，根据高度计算宽度
      newWidth = newHeight * proportion;
    } else {
      // 对角拉伸时，根据拖动距离计算等比例的宽高
      // 计算对角线方向的拉伸距离
      const ratioWidth = newWidth / style.width;
      const ratioHeight = newHeight / style.height;
      
      // 选择变化较大的一边作为基准
      if (ratioWidth > ratioHeight) {
        newHeight = newWidth / proportion;
      } else {
        newWidth = newHeight * proportion;
      }
    }
  }
  
  // 计算新的位置（保持居中）
  const newLeft = center.x - newWidth / 2;
  const newTop = center.y - newHeight / 2;
  
  // 更新样式
  style.width = Math.round(newWidth);
  style.height = Math.round(newHeight);
  style.left = Math.round(newLeft);
  style.top = Math.round(newTop);
}