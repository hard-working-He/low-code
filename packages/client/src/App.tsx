import { useState, useEffect } from 'react'
import './App.css'
import Toolbar from '@pages/toolbar'
import CanvasAttr from '@components/CanvasAttr'
import LeftPanel from '@/pages/LeftPanel'
import DrawPanel from '@/pages/DrawPanel'
import { useDrop } from '@/hooks'

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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log('Mouse down');
  };
  
  // 使用自定义的useDrop hook处理拖放逻辑
  const { dropProps, isOver } = useDrop({
    onDrop: (data, e) => {
      console.log('组件已放置，索引为:', data);
      // 这里可以添加放置后的处理逻辑，例如添加新组件到画布
    },
    onDragEnter: (e) => {
      console.log('进入放置区域');
    },
    onDragLeave: (e) => {
      console.log('离开放置区域');
    },
    onDragOver: (e) => {
      console.log('拖拽经过放置区域');
    },
    // 指定接受的数据类型
    acceptTypes: ['custom-drag', 'index', 'text/plain']
  });

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
            {...dropProps}
            onMouseDown={handleMouseDown}
            style={{
              minHeight: '300px',
              border: '2px dashed #ccc',
              padding: '20px',
              position: 'relative',
              backgroundColor: isOver ? 'rgba(200, 200, 200, 0.3)' : undefined
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
