import { useState, useEffect } from 'react'
import './App.css'
import Toolbar from '@pages/toolbar'
import CanvasAttr from '@components/CanvasAttr'
import LeftPanel from '@/pages/LeftPanel'
import DrawPanel from '@/pages/DrawPanel'

interface CanvasStyleData {
  color: string;
  opacity: number;
  backgroundColor: string;
  fontSize: number;
}

function App() {
  const [canvasStyleData, setCanvasStyleData] = useState<CanvasStyleData>({
    color: '#000000',
    opacity: 100,
    backgroundColor: '#ffffff',
    fontSize: 14,
  });
  const [leftListOpen, setLeftListOpen] = useState(false);
  
  // 添加效果钩子确保页面加载后输出调试信息
  useEffect(() => {
    console.log("App组件已加载，拖放功能已初始化");
  }, []);

  const updateCanvasStyleData = (key: string, value: string | number) => {
    setCanvasStyleData((prevState) => ({
      ...prevState,
      [key]: value,
    }));
    console.log(canvasStyleData);
  };

  const handleToggleLeftPanel = () => {
    setLeftListOpen(!leftListOpen);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    console.log("从画布区域开始拖拽");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log("Drop事件触发");
    const draggedIndex = e.dataTransfer.getData('index');
    console.log('Dropped item index:', draggedIndex);
    
    // 显示所有可用的dataTransfer数据类型
    console.log("所有可用的数据类型:", e.dataTransfer.types);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {  
    e.preventDefault(); // 这行很重要，允许放置
    console.log('Dragging over drop target');
    
    // 添加视觉反馈
    e.currentTarget.style.backgroundColor = 'rgba(200, 200, 200, 0.3)';
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log('离开放置区域');
    
    // 恢复原始背景
    e.currentTarget.style.backgroundColor = '';
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log('进入放置区域');
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log('Mouse down');
  };

  return (
    <>
      <Toolbar />
      {/* 三栏布局 */}
      <main className='app-container'>
        <section className={`left-panel ${leftListOpen ? 'active' : 'inactive'}`}>
          <LeftPanel />
        </section>
        <button
          title="show-list-btn"
          className="btn show-list left-btn"
          onClick={handleToggleLeftPanel}
        >
          {leftListOpen ? '←' : '→'}
        </button>
        
        <section className='draw-panel'>
          <div 
            className="content" 
            onDrop={handleDrop} 
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragStart={handleDragStart}
            onMouseDown={handleMouseDown}
            style={{
              minHeight: '300px',
              border: '2px dashed #ccc',
              padding: '20px',
              position: 'relative'
            }}
          >
            <DrawPanel />
          </div>
        </section>
        <section className='right-panel'>
          <CanvasAttr 
            canvasStyleData={canvasStyleData} 
            updateCanvasStyleData={updateCanvasStyleData} 
          />
        </section>
      </main>
    </>
  )
}

export default App
