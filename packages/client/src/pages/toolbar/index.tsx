import React, { useState, useEffect } from 'react';
import { Button, Switch, Input, Modal, Upload } from 'antd';
import { UndoOutlined, RedoOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index.scss';
import { useEditorStore, useSnapShotStore, useLayerStore, useComposeStore } from '@/stores';
import type { Component } from '@/stores/useEditorStore';
import toast from '@/utils/toast'
import { exportJsonFile } from '@/utils/fileUtils';
// 正确导入PSD.js库
import PSD from 'psd.js';
// Import the actual Preview component
import Preview from '@/pages/Preview';
const AceEditor = () => <div>Ace Editor Component</div>;

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
  const recordSnapshot = useSnapShotStore((state) => state.recordSnapshot);
  const snapshotIndex = useSnapShotStore((state) => state.snapshotIndex);
  const snapshotData = useSnapShotStore((state) => state.snapshotData);
  
  // State variables
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isShowPreview, setIsShowPreview] = useState(false);
  const [isScreenshot] = useState(false);
  const [isShowAceEditor, setIsShowAceEditor] = useState(false);
  const [isShowDialog, setIsShowDialog] = useState(false);
  const [isExport, setIsExport] = useState(false);
  const [isPsdImport, setIsPsdImport] = useState(false);
  const [jsonData, setJsonData] = useState('');
  const [canvasStyleData, setCanvasStyleData] = useState({ width: 1200, height: 740 });
  const [scale, setScale] = useState(100);
  const curComponent = useLayerStore((state) => state.curComponent);
  const [psdLoading, setPsdLoading] = useState(false);
  // 获取选区数据
  const areaData = useComposeStore((state) => state.areaData);
  
  // Watch for component data changes and log them
  useEffect(() => {
    console.log('Component data updated:', componentData);
    console.log('所以useSnapShotStore.getState().snapshotData', useSnapShotStore.getState().snapshotData);
  }, [componentData]);
  
  // Placeholder for component data
  // const areaData = { components: componentData };

  // Event handlers
  const onAceEditorChange = () => {
    setIsShowAceEditor(true);
    // TODO: Implement editor functionality
  };

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

  const handleFileChange = () => {
    // TODO: Implement file change handler
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
        setCanvasStyleData({ width: psdWidth, height: psdHeight });
        
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
          // 更新编辑器状态
          useEditorStore.setState({ componentData: newComponents });
          recordSnapshot();
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
    /* console.log('历史记录', componentData);
    localStorage.setItem('历史记录', JSON.stringify(componentData)); */
    toast('保存成功');
  };

  const clearCanvas = () => {
    clearComponentData();
    recordSnapshot(); // Record snapshot after clearing canvas
  };

  const compose = () => {
    // 使用ComposeStore的compose方法进行组件组合
    useComposeStore.getState().compose();
    recordSnapshot(); // 记录组合后的快照
    toast('组件已组合');
  };

  const decompose = () => {
    if (!curComponent || curComponent.type !== 'group') {
      toast('请选择一个组合组件进行拆分');
      return;
    }
    // 使用ComposeStore的decompose方法进行组件拆分
    useComposeStore.getState().decompose();
    recordSnapshot(); // 记录拆分后的快照
    toast('组件已拆分');
  };

  const lock = () => {
    if (!curComponent) return;
    lockComponent(curComponent.id);
    recordSnapshot(); // Record snapshot after locking component
    toast('组件已锁定');
  };

  const unlock = () => {
    if (!curComponent) return;
    unlockComponent(curComponent.id);
    recordSnapshot(); // Record snapshot after unlocking component
    toast('组件已解锁');
  };

  const handlePreviewChange = () => {
    setIsShowPreview(false);
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(Number(e.target.value));
    // 保留界面显示，但不再触发实际的缩放功能
    console.log('画布比例已更改为:', e.target.value + '%', '(缩放功能已禁用)');
  };

  const handleToggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
    // TODO: Implement dark mode toggle functionality
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
        // Update componentData with imported data
        useEditorStore.setState({ componentData: importData });
        // Add a small delay to ensure state is updated before recording snapshot
        setTimeout(() => {
          recordSnapshot(); // Record snapshot after importing JSON
          toast('导入成功');
        }, 0);
      } catch (error) {
        console.error('JSON 解析错误:', error);
        toast('JSON 格式错误，请检查后重试');
        return;
      }
    }
    setIsShowDialog(false);
  };

  const handleUndo = () => {
    console.log('undo');  
    console.log('Before undo: snapshotIndex=', snapshotIndex, ', snapshotData=', snapshotData);
    
    try {
      undo();
      
      setTimeout(() => {
        console.log('After undo: snapshotIndex=', useSnapShotStore.getState().snapshotIndex);
      }, 10);
    } catch (error) {
      console.error('撤销操作失败:', error);
    }
  };

  const handleRedo = () => {
    console.log('redo');
    console.log('Before redo: snapshotIndex=', snapshotIndex, ', snapshotData=', snapshotData);
    
    try {
      redo();
      
      setTimeout(() => {
        console.log('After redo: snapshotIndex=', useSnapShotStore.getState().snapshotIndex);
      }, 10);
    } catch (error) {
      console.error('重做操作失败:', error);
    }
  };

  // 计算撤销和重做按钮是否应该禁用
  const canUndo = snapshotIndex > 0;
  const canRedo = snapshotIndex < snapshotData.length - 1;
  
  return (
    <div className='toolbar-container'>
      <div className={isDarkMode ? 'dark toolbar' : 'toolbar'}>
        <Button onClick={onAceEditorChange}>JSON</Button>
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
        
        <label htmlFor="input" className="insert">
          插入图片
          <input
            id="input"
            type="file"
            hidden
            onChange={handleFileChange}
          />
        </label>

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

        <div className="canvas-config">
          <span>画布大小</span>
          <Input 
            value={canvasStyleData.width} 
            onChange={e => setCanvasStyleData({...canvasStyleData, width: Number(e.target.value)})} 
          />
          <span>*</span>
          <Input 
            value={canvasStyleData.height} 
            onChange={e => setCanvasStyleData({...canvasStyleData, height: Number(e.target.value)})} 
          />
        </div>
        <div className="canvas-config">
          <span>画布比例</span>
          <Input value={scale} onChange={handleScaleChange} />
          <span>%</span>
        </div>
        <Switch
          checked={isDarkMode}
          className="dark-mode-switch"
          onChange={handleToggleDarkMode}
        />
      </div>

      {/* Preview component */}
      {isShowPreview && <Preview isScreenshot={isScreenshot} onClose={handlePreviewChange} />}
      {isShowAceEditor && <AceEditor />}

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
