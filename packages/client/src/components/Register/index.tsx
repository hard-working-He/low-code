import React from 'react'
import { Form, Input, Button, Alert, Typography } from 'antd'
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores'
import { registerUser } from '@/utils/authApi'
import type { RegisterRequest } from '@/utils/authApi'
import './index.scss'

const { Title, Text } = Typography

interface RegisterProps {
  onSwitchToLogin: () => void
  onClose: () => void
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onClose }) => {
  const [form] = Form.useForm()
  const { login, setLoading, setError, error, isLoading } = useAuthStore()

  const handleSubmit = async (values: RegisterRequest) => {
    setLoading(true)
    setError(null)

    try {
      const response = await registerUser(values)
      
      if (response.success && response.data) {
        // 注册成功后自动登录
        login(response.data)
        form.resetFields()
        onClose()
      } else {
        setError(response.message || '注册失败')
      }
    } catch (error) {
      console.error('Register error:', error)
      setError('网络错误，请检查您的网络连接')
    } finally {
      setLoading(false)
    }
  }

  const validateConfirmPassword = (_: any, value: string) => {
    if (!value || form.getFieldValue('password') === value) {
      return Promise.resolve()
    }
    return Promise.reject(new Error('两次输入的密码不一致'))
  }

  return (
    <div className="register-container">
      <div className="register-header">
        <Title level={3}>注册</Title>
        <Text type="secondary">创建您的低代码平台账号</Text>
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
        name="register"
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
            { max: 20, message: '用户名最多20个字符' },
            { 
              pattern: /^[a-zA-Z0-9_]+$/, 
              message: '用户名只能包含字母、数字和下划线' 
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="用户名"
            disabled={isLoading}
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: '请输入邮箱地址' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="邮箱地址"
            disabled={isLoading}
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6个字符' },
            { max: 50, message: '密码最多50个字符' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码"
            disabled={isLoading}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码' },
            { validator: validateConfirmPassword },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="确认密码"
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
            注册
          </Button>
        </Form.Item>
      </Form>

      <div className="register-footer">
        <Text type="secondary">
          已有账号？{' '}
          <Button
            type="link"
            onClick={onSwitchToLogin}
            disabled={isLoading}
            style={{ padding: 0 }}
          >
            立即登录
          </Button>
        </Text>
      </div>
    </div>
  )
} 