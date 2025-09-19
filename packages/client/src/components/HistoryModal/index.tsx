import React, { useState, useEffect } from 'react'
import { Modal, Table, Button, message, Space, Tag, Tooltip, Popconfirm } from 'antd'
import { HistoryOutlined, EyeOutlined, LoadingOutlined, DeleteOutlined } from '@ant-design/icons'
import './index.scss'
import { getHistories, deleteHistory, type HistoryRecord } from '../../utils/historyApi'
import { useAuthStore } from '../../stores/useAuthStore'
// 格式化时间函数
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 计算相对时间
const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return formatDate(dateString)
}

interface HistoryModalProps {
  visible: boolean
  onClose: () => void
  onLoadHistory?: (record: HistoryRecord) => void
}

const HistoryModal: React.FC<HistoryModalProps> = ({ 
  visible, 
  onClose, 
  onLoadHistory 
}) => {
  const [histories, setHistories] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const { isAuthenticated } = useAuthStore()

  // 获取历史记录数据
  const fetchHistories = async () => {
    if (!isAuthenticated) {
      message.error('请先登录')
      return
    }

    setLoading(true)
    try {
      const response = await getHistories()
      console.log('History API response:', response) // 添加调试日志
      
      // API 响应格式: { data: HistoryRecord[], success: boolean, message: string }
      if (response.success && response.data) {
        console.log('Setting histories:', response.data) // 添加调试日志
        setHistories(response.data)
      } else {
        console.log('API response failed:', response) // 添加调试日志
        setHistories([]) // 确保设置为空数组而不是undefined
        message.error(response.message || '获取历史记录失败')
      }
    } catch (error) {
      console.error('获取历史记录失败:', error)
      setHistories([]) // 确保在错误情况下也设置为空数组
      message.error('获取历史记录失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理加载历史记录
  const handleLoadHistory = (record: HistoryRecord) => {
    if (onLoadHistory) {
      onLoadHistory(record)
      onClose()
      message.success(`已加载项目：${record.title}`)
    }
  }

  // 处理删除历史记录
  const handleDeleteHistory = async (record: HistoryRecord) => {
    try {
      const response = await deleteHistory(record.id)
      if (response.success) {
        message.success(`已删除项目：${record.title}`)
        // 删除成功后重新获取历史记录列表
        fetchHistories()
      } else {
        message.error(response.message || '删除失败')
      }
    } catch (error) {
      console.error('删除历史记录失败:', error)
      message.error('删除历史记录失败')
    }
  }

  // 当模态框打开时获取数据
  useEffect(() => {
    if (visible) {
      fetchHistories()
    }
  }, [visible])

  // 表格列定义
  const columns = [
    {
      title: '项目标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text || '无描述'}</span>
        </Tooltip>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (text: string) => (
        <Tooltip title={formatDate(text)}>
          <Tag color="blue">{getRelativeTime(text)}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 150,
      render: (text: string) => (
        <Tooltip title={formatDate(text)}>
          <Tag color="green">{getRelativeTime(text)}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: any, record: HistoryRecord) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleLoadHistory(record)}
          >
            加载
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除项目"${record.title}"吗？此操作不可恢复。`}
            onConfirm={() => handleDeleteHistory(record)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HistoryOutlined />
          <span>历史记录</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
      width={1000}
      destroyOnClose
      className="history-modal"
    >
      <div className="history-stats">
        <Space>
          <Tag color="cyan">共 {histories?.length || 0} 条记录</Tag>
          {loading && <LoadingOutlined spin />}
        </Space>
      </div>
      
      <Table
        columns={columns}
        dataSource={histories || []}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
        scroll={{ y: 400 }}
        size="small"
      />
    </Modal>
  )
}

export default HistoryModal 