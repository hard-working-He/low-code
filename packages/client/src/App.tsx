import { useEffect } from 'react'
// 导入样式
import './App.css'
import '@assets/iconfont/iconfont.css'

// 导入组件
import Toolbar from '@pages/toolbar'
import CanvasAttr from '@components/CanvasAttr'
import LeftPanel from '@/pages/LeftPanel'
import Editor from '@/pages/Editor'

// 导入自定义hooks和状态管理
import { useDrop } from '@/hooks'
import { useAppStore, useEditorStore } from '@/stores'

import calculateRelativePosition  from '@/utils/computeXY'
import { componentMap } from '@/constants'

function App() {
  // 从应用状态管理器中获取画布样式数据和更新方法
  const canvasStyleData = useAppStore((state) => state.canvasStyleData);
  const updateCanvasStyleData = useAppStore((state) => state.updateCanvasStyleData);
  
  // 左侧面板的展开/折叠状态管理
  const leftListOpen = useAppStore((state) => state.leftListOpen);
  const toggleLeftPanel = useAppStore((state) => state.toggleLeftPanel);
  
  // 拖拽状态管理
  const setIsOver = useAppStore((state) => state.setIsOver);
  
  // 从编辑器状态管理器获取组件数据和添加组件的方法
  const componentData = useEditorStore((state) => state.componentData);
  const addComponent = useEditorStore((state) => state.addComponent);
  const updateComponentPosition = useEditorStore((state) => state.updateComponentPosition);
  // 添加效果钩子确保页面加载后输出调试信息
  useEffect(() => {
    console.log("App组件已加载，拖放功能已初始化");
  }, []);

  console.log(componentData);

  // 使用自定义的useDrop hook处理拖放逻辑
  const { dropProps, isOver } = useDrop({
    onDrop: (data, e) => {
      // 记录组件放置事件并重置拖拽状态
      console.log('组件已放置，索引为:', data);
      setIsOver(false);
      
      // 获取画布元素
      const canvasElement = document.querySelector('.draw-panel .content');
      
      // 计算相对于画布的坐标
      const relativePosition = calculateRelativePosition(e.clientX, e.clientY, canvasElement);
      
      if (relativePosition) {
        // 添加新组件到画布 - 使用计算出的相对坐标定位组件
        addComponent({
          id: (componentData.length + 1).toString(),
          type: componentMap[data as keyof typeof componentMap],
          propValue: 'Hello, world!1666',
          style: {
            top: relativePosition.y,
            left: relativePosition.x,
            width: 100,
            height: 100,
            zIndex: componentData.length + 1,
          },
        });
      }
    },
    onDragEnter: (e) => {
      // 进入拖放区域时更新状态
      console.log('进入放置区域');
      setIsOver(true);
    },
    onDragLeave: (e) => {
      // 离开拖放区域时更新状态
      console.log('离开放置区域');
      setIsOver(false);
    },
    onDragOver: (e) => {
      // 仅在控制台记录拖拽经过事件
      console.log('拖拽经过放置区域');
      
      // 可以在这里获取相对坐标用于实时预览或其他功能
      // const canvasElement = document.querySelector('.draw-panel .content');
      // const relativePosition = calculateRelativePosition(e.clientX, e.clientY, canvasElement);
      // if (relativePosition) {
      //   console.log('相对坐标:', relativePosition.x, relativePosition.y);
      // } else {
      //   console.log('窗口坐标:', e.clientX, e.clientY);
      // }
    },
    // 指定接受的数据类型 - 确保拖放操作只接受指定的数据类型
    acceptTypes: ['custom-drag', 'index', 'text/plain']
  });

  return (
    <>
      <Toolbar />
      {/* 三栏布局：左侧面板、中间画布、右侧属性面板 */}
      <main className='app-container'>
        {/* 左侧组件面板 */}
        <section className={`left-panel ${leftListOpen ? 'active' : 'inactive'}`}>
          <LeftPanel />
        </section>
        {/* 左侧面板折叠/展开按钮 */}
        <div
          className="btn show-list left-btn"
          onClick={toggleLeftPanel}
        >
          {leftListOpen ? '←' : '→'}
        </div>

        {/* 中间画布区域 - 用于放置和编辑组件 */}
        <section className='draw-panel'>
          <div
            className="content"
            {...dropProps}
          >
            <Editor />
          </div>
        </section>
        {/* 右侧属性面板 - 用于编辑画布和组件属性 */}
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
