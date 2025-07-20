import React, { useEffect } from 'react';
import componentList from '@constants/index';
import './index.scss';

const LeftPanel: React.FC = () => {
    useEffect(() => {
        console.log("左侧面板已加载，组件列表可拖拽");
    }, []);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        // 确保我们能获取到正确的index
        const index = e.currentTarget.dataset.index;
        console.log('拖拽开始，设置index数据:', index);
        
        // 设置多种格式的数据以确保兼容性
        e.dataTransfer.setData('text/plain', index || '');
        e.dataTransfer.setData('index', index || '');
        
        // 设置拖拽效果
        e.dataTransfer.effectAllowed = 'copy';
        
        // 可选：设置拖拽图像
        // const dragImage = document.createElement('div');
        // dragImage.textContent = `组件 ${index}`;
        // dragImage.style.backgroundColor = '#fff';
        // dragImage.style.padding = '10px';
        // document.body.appendChild(dragImage);
        // e.dataTransfer.setDragImage(dragImage, 0, 0);
        // setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        console.log('clicked ', e.currentTarget.dataset.index);
    };

    return (
        <div className="component-list">
            {componentList.map((item, index) => (
                <div
                    key={index}
                    className="list"
                    draggable={true}
                    data-index={index}
                    onDragStart={handleDragStart}
                    onClick={handleClick}
                >
                    {item.icon.substr(0, 2) === 'el' ? (
                        <span className={item.icon}></span>
                    ) : (
                        <span className={`iconfont icon-${item.icon}`}></span>
                    )}
                </div>
            ))}
        </div>
    );
};

export default LeftPanel;