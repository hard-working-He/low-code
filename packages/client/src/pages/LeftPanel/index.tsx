import React, { useEffect } from 'react';
import componentList from '@constants/index';
import { useDrag } from '@/hooks';
// 只导入需要的图标
import { LineChartOutlined, PieChartOutlined, BarChartOutlined } from '@ant-design/icons';
import type { ForwardRefExoticComponent } from 'react';
import './index.scss';

// 创建类型安全的图标映射
interface IconMap {
  [key: string]: ForwardRefExoticComponent<any>;
}

const ICON_MAP: IconMap = {
  'LineChartOutlined': LineChartOutlined,
  'PieChartOutlined': PieChartOutlined,
  'BarChartOutlined': BarChartOutlined,
  // 可以根据需要添加更多图标
};

const LeftPanel: React.FC = () => {
    useEffect(() => {
        console.log("左侧面板已加载，组件列表可拖拽");
    }, []);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
        console.log('clicked ', index);
    };

    // 按需渲染 Antd 图标组件
    const renderAntdIcon = (iconName: string) => {
        const IconComponent = ICON_MAP[iconName];
        return IconComponent ? <IconComponent /> : null;
    };

    return (
        <div className="component-list">
            {componentList.map((item, index) => {
                // 为每个组件使用useDrag hook
                const { dragProps } = useDrag({
                    type: 'index',
                    data: index,
                    onDragStart: (e) => {
                        console.log('拖拽开始，组件索引:', index);
                    },
                    onDragEnd: (e) => {
                        console.log('拖拽结束，组件索引:', index);
                    }
                });

                return (
                    <div
                        key={index}
                        className="list"
                        {...dragProps}
                        data-index={index}
                        onClick={(e) => handleClick(e, index)}
                    >
                        {item.icon && (
                            item.icon.includes('antd:') ? 
                                renderAntdIcon(item.icon.split(':')[1]) :
                                item.icon.substr(0, 2) === 'el' ? (
                                    <span className={item.icon}></span>
                                ) : (
                                    <span className={`iconfont icon-${item.icon}`}></span>
                                )
                        )}
                        
                    </div>
                );
            })}
        </div>
    );
};

export default LeftPanel;