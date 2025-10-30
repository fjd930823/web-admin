import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { useEmotionCss } from '@ant-design/use-emotion-css';
import { Helmet, history } from '@umijs/max';
import { message } from 'antd';
import React from 'react';
import { register } from '@/services/api';

const Register: React.FC = () => {
  const containerClassName = useEmotionCss(() => {
    return {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    };
  });

  const handleSubmit = async (values: any) => {
    try {
      await register(values);
      message.success('注册成功！请登录');
      history.push('/user/login');
    } catch (error: any) {
      message.error(error.message || '注册失败，请重试！');
    }
  };

  return (
    <div className={containerClassName}>
      <Helmet>
        <title>注册 - 前端管理系统</title>
      </Helmet>
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" src="/logo.svg" />}
          title="前端管理系统"
          subTitle="创建新账号"
          submitter={{
            searchConfig: {
              submitText: '注册',
            },
          }}
          onFinish={async (values) => {
            await handleSubmit(values as any);
          }}
        >
          <ProFormText
            name="username"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined />,
            }}
            placeholder="请输入用户名"
            rules={[
              {
                required: true,
                message: '用户名是必填项！',
              },
              {
                min: 3,
                message: '用户名至少3个字符！',
              },
            ]}
          />
          <ProFormText
            name="email"
            fieldProps={{
              size: 'large',
              prefix: <MailOutlined />,
            }}
            placeholder="请输入邮箱"
            rules={[
              {
                required: true,
                message: '邮箱是必填项！',
              },
              {
                type: 'email',
                message: '请输入有效的邮箱地址！',
              },
            ]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            placeholder="请输入密码（至少6位）"
            rules={[
              {
                required: true,
                message: '密码是必填项！',
              },
              {
                min: 6,
                message: '密码至少6个字符！',
              },
            ]}
          />
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <a onClick={() => history.push('/user/login')}>
              已有账号？去登录
            </a>
          </div>
        </LoginForm>
      </div>
    </div>
  );
};

export default Register;