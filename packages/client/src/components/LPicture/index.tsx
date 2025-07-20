/**
 * LPicture 组件 - 在画布上渲染图片并提供翻转功能
 * 该组件从 Vue 转换为 React 与 TypeScript
 */
import { useEffect, useRef } from 'react'

/**
 * PropValue 接口 - 定义图片的预期属性
 * @property {string} url - 要显示的图片的 URL
 * @property {object} flip - 包含垂直和水平翻转的标志
 * @property {boolean} flip.vertical - 是否垂直翻转图片
 * @property {boolean} flip.horizontal - 是否水平翻转图片
 */
interface PropValue {
  url: string;
  flip: {
    vertical: boolean;
    horizontal: boolean;
  };
}

/**
 * Element 接口 - 定义元素的样式属性
 * @property {object} style - 包含尺寸信息
 * @property {number} style.width - 图片宽度（像素）
 * @property {number} style.height - 图片高度（像素）
 */
interface Element {
  style: {
    width: number;
    height: number;
  };
}

/**
 * LPictureProps 接口 - 定义组件的属性
 * @property {PropValue} propValue - 图片属性，包括 URL 和翻转设置
 * @property {Element} element - 元素样式信息，包括尺寸
 */
interface LPictureProps {
  propValue: PropValue;
  element: Element;
}

/**
 * LPicture 组件 - 用于显示和操作图片的 React 组件
 * 
 * @param {LPictureProps} props - 组件属性
 * @returns {JSX.Element} - 渲染的组件
 */
const LPicture = ({ propValue, element }: LPictureProps) => {
  let { url, flip } = propValue || { url: '', flip: { vertical: false, horizontal: false } };
  if (!url) {
    url = 'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcSOT0Cg6NGLJoqXVQEIbjujUgr71_pkbs15gZXjB67hFeDfgHrBSE8rz4EZjj3HaXYzIFULyBgszkpDXg2OypDFx8bBLKD8cYZe5yBVDQ';
  }
  if (!flip) {
    flip = { vertical: false, horizontal: false };
  }
  // 画布 DOM 元素的引用
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // 存储图片元素以在绘制操作中重用的引用
  const imgRef = useRef<HTMLImageElement | null>(null)
  // 画布的 2D 渲染上下文的引用
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  // 跟踪首次渲染的标志 - 相当于 Vue 的 isFirst 数据属性
  const isFirstRef = useRef<boolean>(true)

  /**
   * drawImage - 处理在画布上绘制图片
   * 
   * 此函数：
   * 1. 根据元素样式设置画布尺寸
   * 2. 在首次渲染时，创建新图片并从 URL 加载
   * 3. 在后续渲染时，只调用 mirrorFlip 以使用当前设置重新绘制
   */
  const drawImage = () => {
    // 如果画布或上下文不可用，则提前返回
    if (!canvasRef.current || !ctxRef.current) return;
    
    // 从属性中获取尺寸
    const { width, height } = element.style;
    // 设置画布尺寸以匹配容器
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    
    if (isFirstRef.current) {
      // 首次渲染 - 需要加载图片
      isFirstRef.current = false;
      // 创建新的图片元素
      const img = new Image();
      img.src = propValue.url;
      // 存储在引用中以重用
      imgRef.current = img;
      // 等待图片加载完成后绘制
      img.onload = () => {
        if (ctxRef.current) {
          // 绘制原始图片
          ctxRef.current.drawImage(img, 0, 0, width, height);
          // 应用任何翻转设置
          mirrorFlip();
        }
      };
    } else {
      // 非首次渲染，只对现有图片应用翻转设置
      mirrorFlip();
    }
  };

  /**
   * mirrorFlip - 对图片应用水平和/或垂直翻转
   * 
   * 此函数使用画布变换来翻转图片：
   * 1. 清除画布
   * 2. 平移以适应翻转
   * 3. 在需要翻转的维度上按 -1 缩放
   * 4. 绘制图片
   * 5. 重置变换矩阵
   */
  const mirrorFlip = () => {
    // 如果任何必需的引用不可用，则提前返回
    if (!canvasRef.current || !ctxRef.current || !imgRef.current) return;
    
    // 从属性中获取翻转设置
    const { vertical, horizontal } = propValue.flip;
    const { width, height } = element.style;
    // 根据翻转设置计算缩放因子
    const hvalue = horizontal ? -1 : 1;
    const vValue = vertical ? -1 : 1;

    // 从画布中清除之前的图片
    ctxRef.current.clearRect(0, 0, width, height);
    
    // 平移以适应缩放
    // 这个计算确保图片在翻转时保持居中
    ctxRef.current.translate(width / 2 - width * hvalue / 2, height / 2 - height * vValue / 2);
    
    // 应用缩放以创建镜像效果
    ctxRef.current.scale(hvalue, vValue);
    
    // 使用应用的变换绘制图片
    ctxRef.current.drawImage(imgRef.current, 0, 0, width, height);
    
    // 将变换矩阵重置为单位矩阵
    // 这确保未来的绘制操作不受影响
    ctxRef.current.setTransform(1, 0, 0, 1, 0, 0);
  };

  /**
   * 初始化组件 - 类似于 Vue 的 mounted 生命周期钩子
   * 
   * 此效果在组件挂载时运行一次，并：
   * 1. 获取画布渲染上下文
   * 2. 启动首次图片绘制
   */
  useEffect(() => {
    if (canvasRef.current) {
      // 从画布获取 2D 渲染上下文
      ctxRef.current = canvasRef.current.getContext('2d');
      // 图片的初始绘制
      drawImage();
    }
    // 空依赖数组确保这只在挂载时运行一次
  }, []);

  /**
   * 监听尺寸变化 - 类似于 Vue 对 element.style.width/height 的监听
   * 
   * 此效果在元素尺寸变化时运行，并重新绘制图片
   */
  useEffect(() => {
    drawImage();
    // 依赖项确保这在宽度或高度变化时运行
  }, [element.style.width, element.style.height]);

  /**
   * 监听翻转设置变化 - 类似于 Vue 对 propValue.flip 属性的监听
   * 
   * 此效果在翻转设置变化时运行，并应用新的翻转设置
   * 仅在非首次渲染时运行（因为 drawImage 处理首次渲染）
   */
  useEffect(() => {
    if (!isFirstRef.current) {
      mirrorFlip();
    }
    // 依赖项确保这在翻转设置变化时运行
  }, [propValue.flip.vertical, propValue.flip.horizontal]);

  // 渲染一个带有隐藏溢出的 div，包含画布
  return (
    <div style={{ overflow: 'hidden'}}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default LPicture