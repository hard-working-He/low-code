import { useEffect, useState } from 'react'
import { message } from 'antd'
// 导入样式
import './App.css'
import '@assets/iconfont/iconfont.css'
import { ToastContainer } from 'react-toastify';
// Configure message global settings
message.config({
  top: 10000,
  duration: 1,
  maxCount: 3,
});

// 导入组件
import Toolbar from '@pages/toolbar'
import CanvasAttr from '@components/CanvasAttr'
import LeftPanel from '@/pages/LeftPanel'
import Editor from '@/pages/Editor'
import AttrList from '@/pages/AttrList'

// 导入自定义hooks和状态管理
import { useDrop } from '@/hooks'
import { useAppStore, useEditorStore, useLayerStore, useSnapShotStore } from '@/stores'
import { componentMap } from '@/constants'
import calculateRelativePosition  from '@/utils/computeXY'

function App() {
  // 从应用状态管理器中获取画布样式数据和更新方法
  const canvasStyleData = useAppStore((state) => state.canvasStyleData);
  const updateCanvasStyleData = useAppStore((state) => state.updateCanvasStyleData);
  
  // 从LayerStore中获取当前选中的组件
  const curComponent = useLayerStore((state) => state.curComponent);
  
  // 左侧面板的展开/折叠状态管理
  const leftListOpen = useAppStore((state) => state.leftListOpen);
  const toggleLeftPanel = useAppStore((state) => state.toggleLeftPanel);
  
  // 拖拽状态管理
  const setIsOver = useAppStore((state) => state.setIsOver);
  
  // 从编辑器状态管理器获取组件数据和添加组件的方法
  const componentData = useEditorStore((state) => state.componentData);
  const addComponent = useEditorStore((state) => state.addComponent);
  
  // 从快照存储获取记录快照的方法
  const recordSnapshot = useSnapShotStore((state) => state.recordSnapshot);
  
  // 添加效果钩子确保页面加载后输出调试信息
  useEffect(() => {
    //console.log("App组件已加载，拖放功能已初始化");
    
    // Log any click on the document to help debug event propagation
    const handleDocumentClick = (e: MouseEvent) => {
      console.log('Document clicked:', e.target);
    };
    
    document.addEventListener('click', handleDocumentClick);
    
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  //console.log('Current components:', componentData);

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
        
        // 为data=3的情况设置特殊的propValue
        let propValue;
        if (data === 2) {
          propValue = {
            url: 'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcSOT0Cg6NGLJoqXVQEIbjujUgr71_pkbs15gZXjB67hFeDfgHrBSE8rz4EZjj3HaXYzIFULyBgszkpDXg2OypDFx8bBLKD8cYZe5yBVDQ',
            flip: {
              vertical: false,
              horizontal: false
            }
          };
        } else {
          propValue = 'Hello, world!1666';
        }
        
        addComponent({
          id: (componentData.length + 1).toString(),
          index: componentData.length + 1,
          type: componentMap[data as keyof typeof componentMap],
          propValue: propValue,
          style: {
            top: relativePosition.y,
            left: relativePosition.x,
            width: 100,  // Add default width没有宽高无法放大缩小
            height: 100, // Add default height
          },
        });
        
        // 组件添加后，立即记录一个新的快照
        // 使用setTimeout确保在状态更新后记录快照
        setTimeout(() => {
          console.log('拖拽结束，组件索引:', data, '记录新快照');
          try {
            // 确保有组件数据后再记录快照
            const components = useEditorStore.getState().componentData;
            if (components && components.length > 0) {
              recordSnapshot();
              console.log('添加组件后的componentData:', components,
                '添加组件后快照数据:', useSnapShotStore.getState().snapshotData,'索引',useSnapShotStore.getState().snapshotIndex);
            } else {
              console.warn('组件数据为空，跳过快照记录');
            }
          } catch (error) {
            console.error('记录快照失败:', error);
          }
        }, 0);
      }
    },
    onDragEnter: (e) => {
      // 进入拖放区域时更新状态
      //console.log('进入放置区域');
      setIsOver(true);
    },
    onDragLeave: (e) => {
      // 离开拖放区域时更新状态
      //console.log('离开放置区域');
      setIsOver(false);
    },
    onDragOver: (e) => {
      // 仅在控制台记录拖拽经过事件
      // console.log('拖拽经过放置区域');
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
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              background: isOver ? 'rgba(0, 0, 255, 0.1)' : 'transparent',
            }}
          >
            <Editor />
          </div>
        </section>
        {/* 右侧属性面板 - 用于编辑画布和组件属性 */}
        <section className='right-panel'>
          {curComponent ? <AttrList /> : <CanvasAttr
            canvasStyleData={canvasStyleData}
            updateCanvasStyleData={updateCanvasStyleData}
          />}
        </section>
      </main>
      <ToastContainer />
    </>
  )
}

export default App
