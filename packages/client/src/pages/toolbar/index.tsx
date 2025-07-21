import React, { useState, useEffect } from 'react';
import { Button, Switch, Input, Modal, Upload } from 'antd';
import { UndoOutlined, RedoOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index.scss';
import { useEditorStore, useSnapShotStore } from '@/stores';
import type { Component } from '@/stores/useEditorStore';
import toast from '@/utils/toast'
// Import the actual Preview component
import Preview from '@/pages/Preview';
const AceEditor = (props: { onCloseEditor: () => void }) => <div>Ace Editor Component</div>;

const Toolbar: React.FC = () => {
  const navigate = useNavigate();
  
  // Editor store functions
  const componentData = useEditorStore((state) => state.componentData);
  const clearComponentData = useEditorStore((state) => state.clearComponentData);

  // Snapshot store functions
  const undo = useSnapShotStore((state) => state.undo);
  const redo = useSnapShotStore((state) => state.redo);
  const recordSnapshot = useSnapShotStore((state) => state.recordSnapshot);
  const snapshotIndex = useSnapShotStore((state) => state.snapshotIndex);
  const snapshotData = useSnapShotStore((state) => state.snapshotData);
  
  // State variables
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isShowPreview, setIsShowPreview] = useState(false);
  const [isScreenshot, setIsScreenshot] = useState(false);
  const [isShowAceEditor, setIsShowAceEditor] = useState(false);
  const [isShowDialog, setIsShowDialog] = useState(false);
  const [isExport, setIsExport] = useState(false);
  const [jsonData, setJsonData] = useState('');
  const [canvasStyleData, setCanvasStyleData] = useState({ width: 1200, height: 740 });
  const [scale, setScale] = useState(100);
  const [curComponent, setCurComponent] = useState<Component | null>(null);
  
  // Watch for component data changes and log them
  useEffect(() => {
    console.log('Component data updated:', componentData);
    console.log('所以useSnapShotStore.getState().snapshotData', useSnapShotStore.getState().snapshotData);
  }, [componentData]);
  
  // Placeholder for component data
  const areaData = { components: componentData };

  // Event handlers
  const onAceEditorChange = () => {
    setIsShowAceEditor(true);
    // TODO: Implement editor functionality
  };

  const onImportJSON = () => {
    setIsExport(false);
    setJsonData(''); // Clear the textarea when opening import modal
    setIsShowDialog(true);
  };

  const onExportJSON = () => {
    setIsExport(true);
    setIsShowDialog(true);
    setJsonData(JSON.stringify(componentData, null, 2));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implement file change handler
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
    console.log('历史记录', componentData);
    localStorage.setItem('历史记录', JSON.stringify(componentData));
    toast('保存成功');
  };

  const clearCanvas = () => {
    clearComponentData();
    recordSnapshot(); // Record snapshot after clearing canvas
  };

  const compose = () => {
    // TODO: Implement compose functionality
    recordSnapshot(); // Record snapshot after composition
  };

  const decompose = () => {
    // TODO: Implement decompose functionality
    recordSnapshot(); // Record snapshot after decomposition
  };

  const lock = () => {
    // TODO: Implement lock functionality
    recordSnapshot(); // Record snapshot after locking
  };

  const unlock = () => {
    // TODO: Implement unlock functionality
    recordSnapshot(); // Record snapshot after unlocking
  };

  const handlePreviewChange = () => {
    setIsShowPreview(false);
  };

  const closeEditor = () => {
    setIsShowAceEditor(false);
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
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      setJsonData(reader.result as string);
    };
    return false; // Prevent default upload behavior
  };

  const processJSON = () => {
    if (isExport) {
      // Create a blob with the JSON data
      const blob = new Blob([jsonData], { type: 'application/json' });
      // Create a temporary download link
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `low-code-export-${new Date().getTime()}.json`;
      // Trigger download and cleanup
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast('导出成功');
    } else if (jsonData) {
      try {
        const importData = JSON.parse(jsonData);
        // Update componentData with imported data
        useEditorStore.setState({ componentData: importData });
        toast('导入成功');
        recordSnapshot(); // Record snapshot after importing JSON
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
          disabled={!curComponent || curComponent?.isLock || curComponent?.component !== 'Group'}
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
      {isShowAceEditor && <AceEditor onCloseEditor={closeEditor} />}

      <Modal
        title={isExport ? '导出数据' : '导入数据'}
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
              accept="application/json"
            >
              <Button type="primary">选择 JSON 文件</Button>
            </Upload>
          ),
          <Button key="ok" type="primary" onClick={processJSON}>确 定</Button>
        ]}
        width={600}
        maskClosable={false}
        keyboard={false}
      >
        <Input.TextArea
          value={jsonData}
          onChange={e => setJsonData(e.target.value)}
          rows={20}
          placeholder="请输入 JSON 数据"
        />
      </Modal>
    </div>
  );
};

export default Toolbar;
