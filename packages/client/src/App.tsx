import { useEffect } from 'react'
import './App.css'
import '@assets/iconfont/iconfont.css'
import Toolbar from '@pages/toolbar'
import CanvasAttr from '@components/CanvasAttr'
import LeftPanel from '@/pages/LeftPanel'
import Editor from '@/pages/Editor'
import { useDrop } from '@/hooks'
import { useAppStore } from './stores/useAppStore'

function App() {
  const canvasStyleData = useAppStore((state) => state.canvasStyleData);
  const updateCanvasStyleData = useAppStore((state) => state.updateCanvasStyleData);
  const leftListOpen = useAppStore((state) => state.leftListOpen);
  const toggleLeftPanel = useAppStore((state) => state.toggleLeftPanel);
  const setIsOver = useAppStore((state) => state.setIsOver);

  // 添加效果钩子确保页面加载后输出调试信息
  useEffect(() => {
    console.log("App组件已加载，拖放功能已初始化");
  }, []);

  // 使用自定义的useDrop hook处理拖放逻辑
  const { dropProps, isOver } = useDrop({
    onDrop: (data, e) => {
      console.log('组件已放置，索引为:', data);
      setIsOver(false);
      // 这里可以添加放置后的处理逻辑，例如添加新组件到画布
    },
    onDragEnter: (e) => {
      console.log('进入放置区域');
      setIsOver(true);
    },
    onDragLeave: (e) => {
      console.log('离开放置区域');
      setIsOver(false);
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
        <div
          className="btn show-list left-btn"
          onClick={toggleLeftPanel}
        >
          {leftListOpen ? '←' : '→'}
        </div>

        <section className='draw-panel'>
          <div
            className="content"
            {...dropProps}
          >
            <Editor />
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
