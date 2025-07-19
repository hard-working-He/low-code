import React from 'react';
import  componentList  from '@constants/index';
import './index.scss';

const LeftPanel: React.FC = () => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.dataTransfer.setData('index', index.toString());
    };

    return (
        <div className="component-list">
            {componentList.map((item, index) => (
                <div
                    key={index}
                    className="list"
                    draggable
                    data-index={index}
                    onDragStart={(e) => handleDragStart(e, index)}
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