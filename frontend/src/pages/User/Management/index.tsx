import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { getUsers, createUser, deleteUser, updateUserRole, resetUserPassword } from '@/services/api';

interface UserItem {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

const UserManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserItem | null>(null);

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await createUser(values);
      message.success('创建成功');
      setCreateModalVisible(false);
      actionRef.current?.reload();
      return true;
    } catch (error: any) {
      message.error(error.message || '创建失败');
      return false;
    }
  };

  const handleUpdateRole = async (values: any) => {
    if (!currentUser) return false;
    try {
      await updateUserRole(currentUser.id, values.role);
      message.success('角色更新成功');
      setRoleModalVisible(false);
      setCurrentUser(null);
      actionRef.current?.reload();
      return true;
    } catch (error: any) {
      message.error(error.message || '更新失败');
      return false;
    }
  };

  const handleResetPassword = async (values: any) => {
    if (!currentUser) return false;
    try {
      await resetUserPassword(currentUser.id, values.password);
      message.success('密码重置成功');
      setPasswordModalVisible(false);
      setCurrentUser(null);
      return true;
    } catch (error: any) {
      message.error(error.message || '重置失败');
      return false;
    }
  };

  const columns: ProColumns<UserItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      ellipsis: true,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      ellipsis: true,
      search: false,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 120,
      valueType: 'select',
      valueEnum: {
        admin: { text: '管理员', status: 'Success' },
        user: { text: '普通用户', status: 'Default' },
      },
      render: (_, record) => {
        const roleMap = {
          admin: { color: 'red', text: '管理员' },
          user: { color: 'blue', text: '普通用户' },
        };
        const role = roleMap[record.role];
        return <Tag color={role?.color}>{role?.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 240,
      render: (_, record) => [
        <Button
          key="role"
          type="link"
          size="small"
          onClick={() => {
            setCurrentUser(record);
            setRoleModalVisible(true);
          }}
        >
          修改角色
        </Button>,
        <Button
          key="password"
          type="link"
          size="small"
          onClick={() => {
            setCurrentUser(record);
            setPasswordModalVisible(true);
          }}
        >
          重置密码
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个用户吗？"
          onConfirm={() => handleDelete(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" danger>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<UserItem>
        headerTitle="用户列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              setCreateModalVisible(true);
            }}
          >
            <PlusOutlined /> 新建用户
          </Button>,
        ]}
        request={async (params) => {
          try {
            const response = await getUsers({
              page: params.current,
              pageSize: params.pageSize,
              username: params.username,
              role: params.role,
            });
            return {
              data: response.data,
              success: response.success,
              total: response.total,
            };
          } catch (error) {
            message.error('获取用户列表失败');
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        columns={columns}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
      />

      <ModalForm
        title="创建用户"
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreate}
      >
        <ProFormText
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, message: '用户名至少3个字符' },
          ]}
        />
        <ProFormText
          name="email"
          label="邮箱"
          placeholder="请输入邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        />
        <ProFormText.Password
          name="password"
          label="密码"
          placeholder="请输入密码（至少6位）"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6个字符' },
          ]}
        />
        <ProFormSelect
          name="role"
          label="角色"
          placeholder="请选择角色"
          options={[
            { label: '普通用户', value: 'user' },
            { label: '管理员', value: 'admin' },
          ]}
          initialValue="user"
          rules={[{ required: true, message: '请选择角色' }]}
        />
      </ModalForm>

      <ModalForm
        title="修改用户角色"
        open={roleModalVisible}
        onOpenChange={setRoleModalVisible}
        onFinish={handleUpdateRole}
        initialValues={{
          role: currentUser?.role,
        }}
      >
        <ProFormText
          name="username"
          label="用户名"
          disabled
          initialValue={currentUser?.username}
        />
        <ProFormSelect
          name="role"
          label="角色"
          placeholder="请选择角色"
          options={[
            { label: '普通用户', value: 'user' },
            { label: '管理员', value: 'admin' },
          ]}
          rules={[{ required: true, message: '请选择角色' }]}
        />
      </ModalForm>

      <ModalForm
        title="重置用户密码"
        open={passwordModalVisible}
        onOpenChange={setPasswordModalVisible}
        onFinish={handleResetPassword}
      >
        <ProFormText
          name="username"
          label="用户名"
          disabled
          initialValue={currentUser?.username}
        />
        <ProFormText.Password
          name="password"
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
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default UserManagement;