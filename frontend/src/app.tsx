import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { PageLoading, ModalForm, ProFormText } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { LogoutOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { Dropdown, message } from 'antd';
import { useState } from 'react';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import { currentUser as queryCurrentUser } from './services/ant-design-pro/api';
import { changePassword } from './services/api';

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser({
        skipErrorHandler: true,
      });
      return msg.data;
    } catch (error) {
      history.push(loginPath);
    }
    return undefined;
  };

  const { location } = history;
  if (location.pathname !== loginPath) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  let passwordModalVisible = false;
  let setPasswordModalVisible: (visible: boolean) => void;

  return {
    avatarProps: {
      src: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
      title: initialState?.currentUser?.username,
      render: (_, avatarChildren) => {
        const PasswordModal = () => {
          const [visible, setVisible] = useState(false);
          setPasswordModalVisible = setVisible;

          const handleChangePassword = async (values: any) => {
            try {
              await changePassword(values.oldPassword, values.newPassword);
              message.success('密码修改成功');
              setVisible(false);
              return true;
            } catch (error: any) {
              message.error(error.message || '密码修改失败');
              return false;
            }
          };

          return (
            <ModalForm
              title="修改密码"
              open={visible}
              onOpenChange={setVisible}
              onFinish={handleChangePassword}
              width={400}
            >
              <ProFormText.Password
                name="oldPassword"
                label="旧密码"
                placeholder="请输入旧密码"
                rules={[
                  { required: true, message: '请输入旧密码' },
                ]}
              />
              <ProFormText.Password
                name="newPassword"
                label="新密码"
                placeholder="请输入新密码（至少6位）"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              />
              <ProFormText.Password
                name="confirmPassword"
                label="确认密码"
                placeholder="请再次输入新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              />
            </ModalForm>
          );
        };

        const menuItems = [
          {
            key: 'userInfo',
            icon: <UserOutlined />,
            label: (
              <div>
                <div>{initialState?.currentUser?.username}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {initialState?.currentUser?.email}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  角色: {initialState?.currentUser?.role === 'admin' ? '管理员' : '普通用户'}
                </div>
              </div>
            ),
          },
          {
            type: 'divider' as const,
          },
          {
            key: 'changePassword',
            icon: <LockOutlined />,
            label: '修改密码',
            onClick: () => {
              if (setPasswordModalVisible) {
                setPasswordModalVisible(true);
              }
            },
          },
          {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: () => {
              localStorage.removeItem('token');
              setInitialState((s: any) => ({ ...s, currentUser: undefined }));
              history.push(loginPath);
            },
          },
        ];

        return (
          <>
            <Dropdown
              menu={{
                items: menuItems,
              }}
            >
              <span style={{ cursor: 'pointer' }}>{avatarChildren}</span>
            </Dropdown>
            <PasswordModal />
          </>
        );
      },
    },
    waterMarkProps: {
      content: initialState?.currentUser?.username,
    },
    footerRender: () => <div />,
    onPageChange: () => {
      const { location } = history;
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    layoutBgImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
    ],
    menuHeaderRender: undefined,
    ...initialState?.settings,
  };
};

export const request = {
  ...errorConfig,
};