import React from 'react'
import { Form, Input, Button, Alert, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores'
import { loginUser } from '@/utils/authApi'
import type { LoginRequest } from '@/utils/authApi'
import './index.scss'

const { Title, Text } = Typography

interface LoginProps {
  onSwitchToRegister: () => void
  onClose: () => void
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister, onClose }) => {
  const [form] = Form.useForm()
  const { login, setLoading, setError, error, isLoading } = useAuthStore()

  const handleSubmit = async (values: LoginRequest) => {
    setLoading(true)
    setError(null)

    try {
      const response = await loginUser(values)
      
      if (response.success && response.data) {
        login(response.data)
        form.resetFields()
        onClose()
      } else {
        setError(response.message || '登录失败')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('网络错误，请检查您的网络连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-header">
        <Title level={3}>登录</Title>
        <Text type="secondary">欢迎回到低代码平台</Text>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        name="login"
        onFinish={handleSubmit}
        autoComplete="off"
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="username"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, message: '用户名至少3个字符' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="用户名"
            disabled={isLoading}
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6个字符' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码"
            disabled={isLoading}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            block
          >
            登录
          </Button>
        </Form.Item>
      </Form>

      <div className="login-footer">
        <Text type="secondary">
          还没有账号？{' '}
          <Button
            type="link"
            onClick={onSwitchToRegister}
            disabled={isLoading}
            style={{ padding: 0 }}
          >
            立即注册
          </Button>
        </Text>
      </div>
    </div>
  )
} 