import React, { useState, useEffect } from 'react';
import { Button, Switch, Input, Modal, Upload } from 'antd';
import { UndoOutlined, RedoOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index.scss';
import { useEditorStore, useSnapShotStore, useLayerStore, useComposeStore, useAppStore } from '@/stores';
import type { Component } from '@/stores/useEditorStore';
import toast from '@/utils/toast'
import { exportJsonFile } from '@/utils/fileUtils';
// 正确导入PSD.js库
import PSD from 'psd.js';
// Import the actual Preview component
import Preview from '@/pages/Preview';
//const AceEditor = () => <div>Ace Editor Component</div>;

const Toolbar: React.FC = () => {
  const navigate = useNavigate();
  
  // Editor store functions
  const componentData = useEditorStore((state) => state.componentData);
  const clearComponentData = useEditorStore((state) => state.clearComponentData);
  const lockComponent = useEditorStore((state) => state.lockComponent);
  const unlockComponent = useEditorStore((state) => state.unlockComponent);

  // Snapshot store functions
  const undo = useSnapShotStore((state) => state.undo);
  const redo = useSnapShotStore((state) => state.redo);
  // 删除未使用的 recordSnapshot 变量
  const snapshotIndex = useSnapShotStore((state) => state.snapshotIndex);
  const snapshots = useSnapShotStore((state) => state.snapshots);
  
  // 从应用状态获取暗黑模式设置
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const toggleDarkMode = useAppStore((state) => state.toggleDarkMode);
  
  // 输出快照状态信息，用于调试
  useEffect(() => {
    console.log('快照状态:', {
      snapshotIndex: snapshotIndex,
      snapshots: snapshots,
      snapshotsLength: snapshots?.length || 0
    });
  }, [snapshotIndex, snapshots]);
  
  // State variables
  const [isShowPreview, setIsShowPreview] = useState(false);
  const [isScreenshot] = useState(false);
  //const [isShowAceEditor, setIsShowAceEditor] = useState(false);
  const [isShowDialog, setIsShowDialog] = useState(false);
  const [isExport, setIsExport] = useState(false);
  const [isPsdImport, setIsPsdImport] = useState(false);
  const [jsonData, setJsonData] = useState('');
  const curComponent = useLayerStore((state) => state.curComponent);
  const [psdLoading, setPsdLoading] = useState(false);
  // 获取选区数据
  const areaData = useComposeStore((state) => state.areaData);
  
  // 初始化时应用暗黑模式状态
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, []);
  
  // Watch for component data changes and log them
  useEffect(() => {
    console.log('Component data updated:', componentData);
  }, [componentData]);
  
  // Event handlers

  const onImportJSON = () => {
    setIsExport(false);
    setIsPsdImport(false);
    setJsonData(''); // Clear the textarea when opening import modal
    setIsShowDialog(true);
  };

  const onExportJSON = () => {
    setIsExport(true);
    setIsPsdImport(false);
    setIsShowDialog(true);
    setJsonData(JSON.stringify(componentData, null, 2));
  };

  const onImportPSD = () => {
    setIsExport(false);
    setIsPsdImport(true);
    setIsShowDialog(true);
  };

  // Function to convert PSD layer data to component format
  const convertPsdLayerToComponent = (layer: any, index: number): Component | null => {
    if (!layer.visible || layer.type === 'group') return null;

    const { left, top, width, height } = layer;
    
    // Base component properties
    const baseComponent = {
      id: index.toString(),
      index: index,
      type: 'picture',
      component: 'LPicture',
      label: layer.name || 'PSD Layer',
      icon: 'picture',
      propValue: '',
      style: {
        top,
        left,
        width,
        height,
        rotate: 0,
        opacity: layer.opacity / 255, // PSD uses 0-255 for opacity
      },
      animations: [],
      events: {},
      isLock: false,
    };
    
    // Check if layer has text content
    if (layer.text) {
      return {
        ...baseComponent,
        type: 'text',
        component: 'LText',
        icon: 'text',
        propValue: layer.text.value || 'Text Layer',
        style: {
          ...baseComponent.style,
          fontSize: layer.text.fontSize || 14,
          fontWeight: layer.text.fontWeight || 'normal',
          fontStyle: layer.text.fontStyle || 'normal',
          textDecoration: layer.text.textDecoration || 'none',
          color: layer.text.color || '#000000',
          backgroundColor: 'transparent',
          textAlign: layer.text.textAlign || 'left',
          lineHeight: layer.text.lineHeight || 1.5,
          letterSpacing: layer.text.letterSpacing || 0,
        }
      };
    }
    
    // For image layers, attempt to extract image data
    if (layer.image) {
      const imgData = layer.image.toBase64 ? layer.image.toBase64() : '';
      return {
        ...baseComponent,
        propValue: imgData.startsWith('data:') ? imgData : `data:image/png;base64,${imgData}`,
      };
    }
    
    return baseComponent;
  };

  // Function to handle PSD file upload
  const handlePsdUpload = (file: File) => {
    setPsdLoading(true);
    
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async () => {
      try {
        // 正确使用PSD库解析文件
        // PSD.js API可能不同，我们使用更通用的方法
        // @ts-ignore - 定义一个通用的psd变量类型
        let psd: any;
        
        // 检查是否存在不同版本的API方法
        // @ts-ignore - 忽略类型检查，因为我们正在处理动态API
        if (typeof PSD === 'function') {
          try {
            // @ts-ignore
            psd = new PSD(reader.result as ArrayBuffer);
            if (psd && typeof psd.parse === 'function') {
              await psd.parse();
            }
          } catch (e) {
            console.error('构造函数初始化失败:', e);
          }
        }
        
        // 如果上面的方法失败，尝试其他可能的API
        if (!psd) {
          try {
            // @ts-ignore - 尝试可能的API
            if (typeof PSD.fromBuffer === 'function') {
              // @ts-ignore
              psd = PSD.fromBuffer(reader.result as ArrayBuffer);
              if (psd && typeof psd.parse === 'function') {
                psd.parse();
              }
            } else {
              // @ts-ignore
              psd = PSD;
            }
          } catch (e) {
            console.error('备用方法初始化失败:', e);
          }
        }
        
        if (!psd) {
          toast('PSD库初始化失败，请检查库版本');
          setPsdLoading(false);
          return;
        }
        
        console.log('PSD对象:', psd);
        
        // 获取PSD尺寸信息
        let psdWidth = 1200;
        let psdHeight = 740;
        
        // @ts-ignore - 忽略类型检查，我们已知psd可能有不同的结构
        if (psd && psd.header) {
          // @ts-ignore
          psdWidth = psd.header.width || psdWidth;
          // @ts-ignore
          psdHeight = psd.header.height || psdHeight;
        }
        
        // 更新画布尺寸
        // Removed unused setCanvasStyleData call
        
        // 获取图层树
        let tree: any;
        // @ts-ignore - 忽略类型检查，我们已知psd可能有不同的结构
        if (psd && typeof psd.tree === 'function') {
          // @ts-ignore
          tree = psd.tree();
        } else {
          tree = psd;
        }
        
        if (!tree) {
          console.error('无法获取PSD图层树');
          toast('无法读取PSD图层结构');
          setPsdLoading(false);
          return;
        }
        
        // 提取所有图层
        const allLayers: any[] = [];
        const traverseLayers = (node: any) => {
          if (!node) return;
          
          console.log('处理图层:', node);
          
          // 检查节点是否是组或有children方法
          const isGroup = typeof node.isGroup === 'function' ? node.isGroup() : 
                         (node.children && typeof node.children === 'function');
          
          if (isGroup) {
            const children = node.children ? node.children() : [];
            if (Array.isArray(children)) {
              children.forEach(traverseLayers);
            }
          } else {
            allLayers.push(node);
          }
        };
        
        try {
          traverseLayers(tree);
          console.log('提取的图层:', allLayers);
        } catch (err) {
          console.error('遍历图层错误:', err);
        }
        
        if (allLayers.length === 0) {
          // 如果没有找到图层，可能是库的API不同，尝试直接使用节点列表
          if (tree.children && Array.isArray(tree.children)) {
            tree.children.forEach((layer: any) => allLayers.push(layer));
          }
        }
        
        // 转换图层为组件
        const newComponents = allLayers
          .map((layer, index) => {
            try {
              return convertPsdLayerToComponent(layer, index);
            } catch (err) {
              console.error('图层转换错误:', err);
              return null;
            }
          })
          .filter(Boolean) as Component[];
        
        if (newComponents.length > 0) {
          // 更新编辑器状态 - 使用setComponentData自动记录快照
          useEditorStore.getState().setComponentData(newComponents);
          toast(`PSD 导入成功，共 ${newComponents.length} 个组件`);
        } else {
          toast('未能从PSD中提取有效图层');
        }
        
        setPsdLoading(false);
        setIsShowDialog(false);
      } catch (error) {
        console.error('PSD 解析总错误:', error);
        toast('PSD 解析失败，请检查文件格式和库版本');
        setPsdLoading(false);
      }
    };
    
    reader.onerror = () => {
      toast('PSD 文件读取失败');
      setPsdLoading(false);
    };
    
    return false; // Prevent default upload behavior
  };

  const preview = (isScreenshot: boolean) => {
    if (isScreenshot) {
      // Navigate to screenshot preview route
      navigate('/preview/screenshot');
    } else {
      // Navigate to normal preview page
      navigate('/preview');
    }
  };

  const handleSave = () => {
    /* console.log('历史记录', componentData);*/
    localStorage.setItem('历史记录', JSON.stringify(componentData)); 
    toast('保存成功');
  };

  const clearCanvas = () => {
    clearComponentData();
    // clearComponentData 已经会自动调用 recordSnapshot，不需要再手动调用
    console.log('清空画布后的快照状态:', {
      snapshotIndex: useSnapShotStore.getState().snapshotIndex,
      snapshots: useSnapShotStore.getState().snapshots,
      componentData: useEditorStore.getState().componentData
    });
  };

  const compose = () => {
    // 使用ComposeStore的compose方法进行组件组合
    useComposeStore.getState().compose();
    // compose操作会改变componentData，已经自动触发recordSnapshot
    toast('组件已组合');
  };

  const decompose = () => {
    if (!curComponent || curComponent.type !== 'group') {
      toast('请选择一个组合组件进行拆分');
      return;
    }
    // 使用ComposeStore的decompose方法进行组件拆分
    useComposeStore.getState().decompose();
    // decompose操作会改变componentData，已经自动触发recordSnapshot
    toast('组件已拆分');
  };

  const lock = () => {
    if (!curComponent) return;
    lockComponent(curComponent.id);
    // lockComponent已自动调用recordSnapshot
    toast('组件已锁定');
  };

  const unlock = () => {
    if (!curComponent) return;
    unlockComponent(curComponent.id);
    // unlockComponent已自动调用recordSnapshot
    toast('组件已解锁');
  };

  const handlePreviewChange = () => {
    setIsShowPreview(false);
  };

  /* const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(Number(e.target.value));
    // 保留界面显示，但不再触发实际的缩放功能
    console.log('画布比例已更改为:', e.target.value + '%', '(缩放功能已禁用)');
  }; */

  // 处理暗黑模式切换
  const handleToggleDarkMode = () => {
    toggleDarkMode();
  };

  const beforeUpload = (file: File) => {
    if (isPsdImport) {
      return handlePsdUpload(file);
    }
    
    // For JSON import
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      setJsonData(reader.result as string);
    };
    return false; // Prevent default upload behavior
  };

  const processJSON = () => {
    if (isPsdImport) {
      // PSD导入不需要在这里处理，已经在beforeUpload处理了
      setIsShowDialog(false);
      return;
    }
    
    if (isExport) {
      exportJsonFile(jsonData, `low-code-export-${new Date().getTime()}.json`);
      toast('导出成功');
    } else if (jsonData) {
      try {
        const importData = JSON.parse(jsonData);
          // 使用setComponentData函数更新组件数据，它会自动记录快照
          useEditorStore.getState().setComponentData(importData);
          toast('导入成功');
      } catch (error) {
        console.error('JSON 解析错误:', error);
        toast('JSON 格式错误，请检查后重试');
        return;
      }
    }
    setIsShowDialog(false);
  };

  // 监听componentData变化，输出详细的调试信息
  useEffect(() => {
    if (componentData && componentData.length > 0) {
      console.log('添加组件后的componentData详情:', {
        组件数量: componentData.length,
        组件列表: componentData.map(c => ({ id: c.id, type: c.type })),
        快照索引: snapshotIndex,
        快照数组: snapshots,
        快照长度: snapshots?.length || 0
      });
    }
  }, [componentData, snapshotIndex, snapshots]);

  const handleUndo = () => {
    console.log('undo');  
    console.log('Before undo: snapshotIndex=', snapshotIndex, ', snapshots length=', snapshots.length);
    
    try {
      if (snapshotIndex >= 0) {
        undo();
        
        setTimeout(() => {
          console.log('After undo: snapshotIndex=', useSnapShotStore.getState().snapshotIndex);
        }, 10);
      } else {
        console.log('无法撤销：已经是第一个历史记录');
        toast('已经是第一个历史记录');
      }
    } catch (error) {
      console.error('撤销操作失败:', error);
      toast('撤销操作失败');
    }
  };

  const handleRedo = () => {
    console.log('redo');
    console.log('Before redo: snapshotIndex=', snapshotIndex, ', snapshots length=', snapshots.length);
    
    try {
      if (snapshotIndex < snapshots.length - 1) {
        redo();
        
        setTimeout(() => {
          console.log('After redo: snapshotIndex=', useSnapShotStore.getState().snapshotIndex);
        }, 10);
      } else {
        console.log('无法重做：已经是最新的历史记录');
        toast('已经是最新的历史记录');
      }
    } catch (error) {
      console.error('重做操作失败:', error);
      toast('重做操作失败');
    }
  };

  // 计算撤销和重做按钮是否应该禁用
  const canUndo = snapshotIndex >= 0;
  const canRedo = snapshotIndex < snapshots.length - 1;
  
  return (
    <div className={`toolbar-container ${isDarkMode ? 'dark' : ''}`}>
      <div className={isDarkMode ? 'dark toolbar' : 'toolbar'}>
        {/* <Button onClick={onAceEditorChange}>JSON</Button> */}
        <Button 
          onClick={() => {
            window.open('https://juejin.cn/post/7530558924166905866', '_blank');
          }}
          type="primary"
          style={{ background: 'linear-gradient(272.66deg, #88eded -11.39%, #4ae6cc4d 28.55%, #a0ed9540 92.84%, #c8f398 115.07%), radial-gradient(37.34% 122.3% at 91.54% 146.99%, #4fa7ff80 0, #4fa7ff00 100%), radial-gradient(34.22% 57.56% at 39.34% -26.67%, #6de9b680 0, #6de9b600 100%), linear-gradient(0deg, #fff, #fff)', color: 'black' }}
        >开发文档</Button>
        <Button onClick={onImportJSON}>导入</Button>
        <Button onClick={onExportJSON}>导出</Button>
        
        <Button 
          onClick={handleUndo} 
          icon={<UndoOutlined />}
          disabled={!canUndo}
        >
          撤消
        </Button>
        <Button 
          onClick={handleRedo} 
          icon={<RedoOutlined />}
          disabled={!canRedo}
        >
          重做
        </Button>
        
       {/*  <label htmlFor="input" className="insert">
          插入图片
          <input
            id="input"
            type="file"
            hidden
            onChange={handleFileChange}
          />
        </label> */}

        <Button style={{ marginLeft: '10px' }} onClick={() => preview(false)}>预览</Button>
        <Button onClick={handleSave}>保存</Button>
        <Button onClick={clearCanvas}>清空画布</Button>
        <Button disabled={!areaData.components.length} onClick={compose}>组合</Button>
        <Button
          disabled={!curComponent || curComponent?.isLock || curComponent?.type !== 'group'}
          onClick={decompose}
        >
          拆分
        </Button>

        <Button disabled={!curComponent || curComponent?.isLock} onClick={lock} icon={<LockOutlined />}>锁定</Button>
        <Button disabled={!curComponent || !curComponent?.isLock} onClick={unlock} icon={<UnlockOutlined />}>解锁</Button>
        <Button onClick={() => preview(true)}>截图</Button>

       {/*  <div className="canvas-config">
          <span>画布大小</span>
          <Input 
            value="1200"
            onChange={() => {}} 
          />
          <span>*</span>
          <Input 
            value="740"
            onChange={() => {}} 
          />
        </div> */}
{/*         <div className="canvas-config">
          <span>画布比例</span>
          <Input value={scale} onChange={handleScaleChange} />
          <span>%</span>
        </div> */}
        <Switch
          checked={isDarkMode}
          className="dark-mode-switch"
          onChange={handleToggleDarkMode}
        />
        <span className="mode-toggle-text">切换{isDarkMode ? '亮' : '暗'}模式</span>
      </div>

      {/* Preview component */}
      {isShowPreview && <Preview isScreenshot={isScreenshot} onClose={handlePreviewChange} />}
      {/* {isShowAceEditor && <AceEditor />} */}

      <Modal
        title={isExport ? '导出数据' : isPsdImport ? '导入PSD' : '导入数据'}
        open={isShowDialog}
        onCancel={() => setIsShowDialog(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsShowDialog(false)}>取 消</Button>,
          !isExport && (
            <Upload 
              key="upload"
              action="/" 
              beforeUpload={beforeUpload}
              showUploadList={false}
              accept={isPsdImport ? ".psd" : "application/json"}
            >
              <Button type="primary">选择 JSON 文件</Button>
              <Button onClick={onImportPSD}>选择 PSD 文件</Button>
            </Upload>
          ),
          <Button 
            key="ok" 
            type="primary" 
            onClick={processJSON} 
            loading={psdLoading}
            disabled={isPsdImport ? false : (!jsonData && !isExport)}
          >
            确 定
          </Button>
        ]}
        width={600}
        maskClosable={false}
        keyboard={false}
      >
        {!isPsdImport && (
          <Input.TextArea
            value={jsonData}
            onChange={e => setJsonData(e.target.value)}
            rows={20}
            placeholder="请输入 JSON 数据"
          />
        )}
        {isPsdImport && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            {psdLoading ? (
              <div>正在解析 PSD 文件，请稍候...</div>
            ) : (
              <div>请选择一个 PSD 文件进行导入</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Toolbar;
