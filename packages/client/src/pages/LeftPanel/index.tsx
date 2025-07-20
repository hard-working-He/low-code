import React, { useEffect } from 'react';
import componentList from '@constants/index';
import { useDrag } from '@/hooks';
import './index.scss';

const LeftPanel: React.FC = () => {
    useEffect(() => {
        console.log("左侧面板已加载，组件列表可拖拽");
    }, []);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
        console.log('clicked ', index);
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
                        {item.icon.substr(0, 2) === 'el' ? (
                            <span className={item.icon}></span>
                        ) : (
                            <span className={`iconfont icon-${item.icon}`}></span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default LeftPanel;