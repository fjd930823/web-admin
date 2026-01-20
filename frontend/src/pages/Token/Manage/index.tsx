import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { ProTable, ProColumns, ModalForm, ProFormText } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Tag, Tooltip, Typography, Alert } from 'antd';
import { useRef, useState } from 'react';
import type { ActionType } from '@ant-design/pro-components';
import { getAllTokens, addToken, updateToken, deleteToken, type TokenConfig } from '@/services/tokens';

const { Paragraph } = Typography;

export default function TokenManage() {
  const actionRef = useRef<ActionType>();
  const [editingToken, setEditingToken] = useState<TokenConfig | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const columns: ProColumns<TokenConfig>[] = [
    {
      title: '账号',
      dataIndex: 'phone',
      width: 200,
      copyable: true,
      fixed: 'left',
    },
    {
      title: 'Token',
      dataIndex: 'bbs_token',
      ellipsis: true,
      copyable: true,
      render: (_, record) => (
        <Paragraph
          copyable
          style={{ marginBottom: 0, maxWidth: 400 }}
          ellipsis={{ rows: 1, expandable: false }}
        >
          {record.bbs_token}
        </Paragraph>
      ),
    },
    {
      title: (
        <>
          过期时间{' '}
          <Tooltip title="可选字段，用于提醒 Token 何时过期">
            <QuestionCircleOutlined style={{ color: '#999' }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'expires',
      width: 200,
      render: (_, record) => {
        if (!record.expires) {
          return <Tag color="default">未设置</Tag>;
        }
        const expireDate = new Date(record.expires);
        const now = new Date();
        const isExpired = expireDate < now;
        const days = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return (
          <Space direction="vertical" size={0}>
            <span>{expireDate.toLocaleString('zh-CN')}</span>
            {isExpired ? (
              <Tag color="error">已过期</Tag>
            ) : days <= 7 ? (
              <Tag color="warning">剩余 {days} 天</Tag>
            ) : (
              <Tag color="success">剩余 {days} 天</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <a
            onClick={() => {
              setEditingToken(record);
              setModalVisible(true);
            }}
          >
            编辑
          </a>
          <Popconfirm
            title="确定要删除这个 Token 配置吗？"
            onConfirm={async () => {
              try {
                await deleteToken(record.phone);
                message.success('删除成功');
                actionRef.current?.reload();
              } catch (error) {
                message.error('删除失败');
              }
            }}
          >
            <a style={{ color: 'red' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Alert
        message="Token 管理说明"
        description={
          <div>
            <p>1. 在这里管理发帖使用的账号 Token，无需手动编辑服务器上的配置文件</p>
            <p>2. 如何获取 Token：登录论坛 → F12 开发者工具 → Application → Cookies → 复制 bbs_token</p>
            <p>3. 修改后立即生效，下次发帖时会自动使用最新的配置</p>
          </div>
        }
        type="info"
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />

      <ProTable<TokenConfig>
        columns={columns}
        actionRef={actionRef}
        request={async () => {
          try {
            const response = await getAllTokens();
            return {
              data: response.data || [],
              success: true,
            };
          } catch (error) {
            message.error('加载失败');
            return {
              data: [],
              success: false,
            };
          }
        }}
        rowKey="phone"
        search={false}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
        scroll={{ x: 1000 }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingToken(null);
              setModalVisible(true);
            }}
          >
            添加 Token
          </Button>,
        ]}
      />

      <ModalForm<TokenConfig>
        title={editingToken ? '编辑 Token' : '添加 Token'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={editingToken || undefined}
        onFinish={async (values) => {
          try {
            if (editingToken) {
              await updateToken(editingToken.phone, values);
              message.success('更新成功');
            } else {
              await addToken(values);
              message.success('添加成功');
            }
            actionRef.current?.reload();
            return true;
          } catch (error) {
            message.error(editingToken ? '更新失败' : '添加失败');
            return false;
          }
        }}
        modalProps={{
          destroyOnClose: true,
        }}
      >
        <ProFormText
          name="phone"
          label="账号"
          placeholder="请输入账号（手机号或邮箱）"
          rules={[{ required: true, message: '请输入账号' }]}
          disabled={!!editingToken}
          fieldProps={{
            autoComplete: 'off',
          }}
        />
        <ProFormText
          name="bbs_token"
          label="Token"
          placeholder="请输入 bbs_token"
          rules={[{ required: true, message: '请输入 Token' }]}
          fieldProps={{
            autoComplete: 'off',
          }}
          extra="从浏览器 Cookies 中复制 bbs_token 的值"
        />
        <ProFormText
          name="expires"
          label="过期时间"
          placeholder="2026-12-31T23:59:59.999Z"
          fieldProps={{
            autoComplete: 'off',
          }}
          extra="可选，格式：ISO 8601（如：2026-12-31T23:59:59.999Z）"
        />
      </ModalForm>
    </div>
  );
}
