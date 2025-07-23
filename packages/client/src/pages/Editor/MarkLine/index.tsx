import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../../stores/useEditorStore';
import { useLayerStore } from '../../../stores/useLayerStore';
import eventBus from '@/utils/eventBus';
import './index.scss';

/**
 * LineStatus 接口 - 定义标线显示状态
 * xt, xc, xb: x轴方向的标线（上、中、下）
 * yl, yc, yr: y轴方向的标线（左、中、右）
 */
interface LineStatus {
  xt: boolean; // x-top 顶部对齐线
  xc: boolean; // x-center 中部对齐线
  xb: boolean; // x-bottom 底部对齐线
  yl: boolean; // y-left 左侧对齐线
  yc: boolean; // y-center 中间对齐线
  yr: boolean; // y-right 右侧对齐线
}

/**
 * getComponentRotatedStyle - 获取组件样式
 * 简化实现：暂时不处理旋转，直接返回原始样式
 * 
 * @param style - 组件的样式对象
 * @returns 包含位置尺寸的对象
 */
const getComponentRotatedStyle = (style: any) => {
  // 暂时不处理旋转，直接返回原始样式
  return {
    top: style.top,
    left: style.left,
    width: style.width,
    height: style.height,
    bottom: style.top + style.height,
    right: style.left + style.width,
  };
};

/**
 * MarkLine 组件 - 实现画布上的对齐辅助线功能
 * 当拖动组件时，显示垂直和水平对齐线，帮助用户精确定位组件
 */
const MarkLine: React.FC = () => {
    useEffect(()=>{
        console.log('MarkLine挂载');
    },[])
  // 六条对齐线的标识符，分别对应三条横线和三条竖线
  const lines = ['xt', 'xc', 'xb', 'yl', 'yc', 'yr']; 
  // 吸附阈值，相距小于 diff 像素将自动吸附
  const diff = 30; 
  
  // 使用 useState 管理对齐线显示状态
  const [lineStatus, setLineStatus] = useState<LineStatus>({
    xt: false,
    xc: false,
    xb: false,
    yl: false,
    yc: false,
    yr: false,
  });

  // 使用 useRef 引用 DOM 元素，用于操作对齐线
  const lineRefs = {
    xt: useRef<HTMLDivElement>(null),
    xc: useRef<HTMLDivElement>(null),
    xb: useRef<HTMLDivElement>(null),
    yl: useRef<HTMLDivElement>(null),
    yc: useRef<HTMLDivElement>(null),
    yr: useRef<HTMLDivElement>(null),
  };

  const curComponent = useLayerStore((state) => state.curComponent); // 当前选中的组件
  const componentData = useEditorStore((state) => state.componentData); // 所有组件数据
  const updateComponentPosition = useEditorStore((state) => state.updateComponentPosition);
  
  // 使用 useEffect 添加事件监听，类似 Vue 的 mounted 生命周期
  useEffect(() => {
    // 处理组件移动事件
    const handleMove = (isDownward: boolean, isRightward: boolean) => {
      showLine(isDownward, isRightward);
    };

    // 处理组件停止移动事件
    const handleUnmove = () => {
      hideLine();
    };

    // 使用事件总线订阅事件，替代DOM事件监听
    eventBus.on('component:move', handleMove);
    eventBus.on('component:unmove', handleUnmove);

    // 组件卸载时移除事件监听，类似 Vue 的 beforeDestroy
    return () => {
      eventBus.off('component:move', handleMove);
      eventBus.off('component:unmove', handleUnmove);
    };
  }, [curComponent, componentData]);

  /**
   * 隐藏所有对齐线
   */
  const hideLine = () => {
    setLineStatus({
      xt: false,
      xc: false,
      xb: false,
      yl: false,
      yc: false,
      yr: false,
    });
  };

  /**
   * 判断两个值是否接近（用于判断是否需要显示对齐线）
   * @param dragValue - 拖动组件的值
   * @param targetValue - 目标组件的值
   * @returns 是否接近
   */
  const isNearly = (dragValue: number, targetValue: number) => {
    return Math.abs(dragValue - targetValue) <= diff;
  };

  /**
   * 选择要显示的对齐线
   * 同一方向上可能有多条线满足条件，这个函数决定显示哪一条
   * 
   * @param needToShow - 需要显示的线的数组
   * @param isDownward - 是否向下移动
   * @param isRightward - 是否向右移动
   */
  const chooseTheTrueLine = (needToShow: string[], isDownward: boolean, isRightward: boolean) => {
    const newLineStatus = { ...lineStatus };

    // 如果鼠标向右移动，则按从右到左的顺序显示竖线，否则按相反顺序显示
    if (isRightward) {
      if (needToShow.includes('yr')) {
        newLineStatus.yr = true;
      } else if (needToShow.includes('yc')) {
        newLineStatus.yc = true;
      } else if (needToShow.includes('yl')) {
        newLineStatus.yl = true;
      }
    } else {
      if (needToShow.includes('yl')) {
        newLineStatus.yl = true;
      } else if (needToShow.includes('yc')) {
        newLineStatus.yc = true;
      } else if (needToShow.includes('yr')) {
        newLineStatus.yr = true;
      }
    }

    // 如果鼠标向下移动，则按从下到上的顺序显示横线，否则按相反顺序显示
    if (isDownward) {
      if (needToShow.includes('xb')) {
        newLineStatus.xb = true;
      } else if (needToShow.includes('xc')) {
        newLineStatus.xc = true;
      } else if (needToShow.includes('xt')) {
        newLineStatus.xt = true;
      }
    } else {
      if (needToShow.includes('xt')) {
        newLineStatus.xt = true;
      } else if (needToShow.includes('xc')) {
        newLineStatus.xc = true;
      } else if (needToShow.includes('xb')) {
        newLineStatus.xb = true;
      }
    }

    setLineStatus(newLineStatus);
  };

  /**
   * 显示对齐线
   * 核心函数，计算哪些对齐线需要显示，并设置它们的位置
   * 
   * @param isDownward - 是否向下移动
   * @param isRightward - 是否向右移动
   */
  const showLine = (isDownward: boolean, isRightward: boolean) => {
    if (!curComponent || !componentData) return;

    // 计算当前组件样式（暂不处理旋转）
    const curComponentStyle = getComponentRotatedStyle(curComponent.style);
    const curComponentHalfwidth = curComponentStyle.width / 2;
    const curComponentHalfHeight = curComponentStyle.height / 2;
    
    // 先隐藏所有对齐线
    hideLine();
    const needToShow: string[] = [];
    
    // 是否发现了可吸附的位置
    let hasSnap = false;

    // 遍历所有组件，寻找符合对齐条件的组件
    componentData.forEach((component) => {
      // 跳过当前组件自身
      if (component === curComponent) return;
      
      // 计算目标组件的样式
      const componentStyle = getComponentRotatedStyle(component.style);
      const { top, left, bottom, right } = componentStyle;
      const componentHalfwidth = componentStyle.width / 2;
      const componentHalfHeight = componentStyle.height / 2;

      // 定义各种对齐条件
      const conditions = {
        // 顶部对齐的条件
        top: [
          {
            // 当前组件顶部与目标组件顶部对齐
            isNearly: isNearly(curComponentStyle.top, top),
            lineNode: lineRefs.xt.current,
            line: 'xt',
            dragShift: top,
            lineShift: top,
          },
          {
            // 当前组件底部与目标组件顶部对齐
            isNearly: isNearly(curComponentStyle.bottom, top),
            lineNode: lineRefs.xt.current,
            line: 'xt',
            dragShift: top - curComponentStyle.height,
            lineShift: top,
          },
          {
            // 组件与拖拽节点的中间是否对齐
            isNearly: isNearly(curComponentStyle.top + curComponentHalfHeight, top + componentHalfHeight),
            lineNode: lineRefs.xc.current,
            line: 'xc',
            dragShift: top + componentHalfHeight - curComponentHalfHeight,
            lineShift: top + componentHalfHeight,
          },
          {
            // 当前组件顶部与目标组件底部对齐
            isNearly: isNearly(curComponentStyle.top, bottom),
            lineNode: lineRefs.xb.current,
            line: 'xb',
            dragShift: bottom,
            lineShift: bottom,
          },
          {
            // 当前组件底部与目标组件底部对齐
            isNearly: isNearly(curComponentStyle.bottom, bottom),
            lineNode: lineRefs.xb.current,
            line: 'xb',
            dragShift: bottom - curComponentStyle.height,
            lineShift: bottom,
          },
        ],
        // 左侧对齐的条件
        left: [
          {
            // 当前组件左侧与目标组件左侧对齐
            isNearly: isNearly(curComponentStyle.left, left),
            lineNode: lineRefs.yl.current,
            line: 'yl',
            dragShift: left,
            lineShift: left,
          },
          {
            // 当前组件右侧与目标组件左侧对齐
            isNearly: isNearly(curComponentStyle.right, left),
            lineNode: lineRefs.yl.current,
            line: 'yl',
            dragShift: left - curComponentStyle.width,
            lineShift: left,
          },
          {
            // 组件与拖拽节点的中间是否水平对齐
            isNearly: isNearly(curComponentStyle.left + curComponentHalfwidth, left + componentHalfwidth),
            lineNode: lineRefs.yc.current,
            line: 'yc',
            dragShift: left + componentHalfwidth - curComponentHalfwidth,
            lineShift: left + componentHalfwidth,
          },
          {
            // 当前组件左侧与目标组件右侧对齐
            isNearly: isNearly(curComponentStyle.left, right),
            lineNode: lineRefs.yr.current,
            line: 'yr',
            dragShift: right,
            lineShift: right,
          },
          {
            // 当前组件右侧与目标组件右侧对齐
            isNearly: isNearly(curComponentStyle.right, right),
            lineNode: lineRefs.yr.current,
            line: 'yr',
            dragShift: right - curComponentStyle.width,
            lineShift: right,
          },
        ],
      };

      // 遍历所有对齐条件
      Object.keys(conditions).forEach(key => {
        // 遍历符合的条件并处理
        conditions[key as keyof typeof conditions].forEach(condition => {
          if (!condition.isNearly) return;
          
          // 发现可吸附的位置
          hasSnap = true;
          
          // 修改当前组件位置 - 这里会触发吸附效果
          // 直接使用 updateComponentPosition 更新组件位置
          if (key === 'top') {
            updateComponentPosition(
              curComponent.id,
              curComponent.style.left,
              condition.dragShift
            );
          } else if (key === 'left') {
            updateComponentPosition(
              curComponent.id,
              condition.dragShift,
              curComponent.style.top
            );
          }

          // 设置对齐线的位置
          if (condition.lineNode) {
            condition.lineNode.style[key as any] = `${condition.lineShift}px`;
          }
          // 添加到需要显示的对齐线数组
          needToShow.push(condition.line);
        });
      });
    });

    // 选择要显示的线
    if (needToShow.length) {
      chooseTheTrueLine(needToShow, isDownward, isRightward);
    }
    
    // 返回是否找到可吸附的位置
    return hasSnap;
  };

  // 渲染对齐线组件
  return (
    <div className="mark-line">
      {lines.map(line => (
        <div
          key={line}
          ref={lineRefs[line as keyof typeof lineRefs]}
          className={`line ${line.includes('x') ? 'xline' : 'yline'}`}
          style={{ display: lineStatus[line as keyof LineStatus] ? 'block' : 'none' }}
        ></div>
      ))}
    </div>
  );
};

export default MarkLine;
