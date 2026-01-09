import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { useModel } from '@umijs/max';
import {
  getMergeRequests,
  deleteMergeRequest,
  createMergeRequest,
  updateMergeRequest,
  type MergeRequest,
} from '@/services/api';

const MergeRequestList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<MergeRequest | null>(null);
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  const handleDelete = async (id: number) => {
    try {
      await deleteMergeRequest(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await createMergeRequest(values);
      message.success('创建成功');
      setCreateModalVisible(false);
      actionRef.current?.reload();
      return true;
    } catch (error: any) {
      message.error(error.message || '创建失败');
      return false;
    }
  };

  const handleEdit = async (values: any) => {
    if (!currentRecord?.id) return false;
    try {
      await updateMergeRequest(currentRecord.id, values);
      message.success('更新成功');
      setEditModalVisible(false);
      setCurrentRecord(null);
      actionRef.current?.reload();
      return true;
    } catch (error: any) {
      message.error(error.message || '更新失败');
      return false;
    }
  };

  const statusMap = {
    pending: { color: 'orange', text: '待处理' },
    approved: { color: 'blue', text: '已批准' },
    rejected: { color: 'red', text: '已拒绝' },
    merged: { color: 'green', text: '已合并' },
  };

  const columns: ProColumns<MergeRequest>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '合并链接',
      dataIndex: 'merge_url',
      ellipsis: true,
      render: (_, record) => (
        <a
          href={record.merge_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {record.merge_url}
        </a>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        pending: { text: '待处理', status: 'Processing' },
        approved: { text: '已批准', status: 'Success' },
        rejected: { text: '已拒绝', status: 'Error' },
        merged: { text: '已合并', status: 'Success' },
      },
      render: (_, record) => {
        const status = statusMap[record.status as keyof typeof statusMap];
        return <Tag color={status?.color}>{status?.text}</Tag>;
      },
    },
    {
      title: '创建者',
      dataIndex: 'creator_name',
      width: 100,
      search: false,
    },
    {
      title: '合并人',
      dataIndex: 'merger_name',
      width: 100,
      search: false,
      render: (_, record) => record.merger_name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      valueType: 'dateTime',
      search: false,
    },
    ...(currentUser?.role === 'admin'
      ? [
          {
            title: '操作',
            valueType: 'option' as const,
            width: 150,
            render: (_: any, record: MergeRequest) => [
              <Button
                key="edit"
                type="link"
                size="small"
                onClick={() => {
                  setCurrentRecord(record);
                  setEditModalVisible(true);
                }}
              >
                编辑
              </Button>,
              <Popconfirm
                key="delete"
                title="确定要删除这个合并请求吗？"
                onConfirm={() => handleDelete(record.id!)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger>
                  删除
                </Button>
              </Popconfirm>,
            ],
          },
        ]
      : []),
  ];

  return (
    <PageContainer>
      <ProTable<MergeRequest>
        headerTitle="合并请求列表"
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
            <PlusOutlined /> 新建
          </Button>,
        ]}
        request={async (params) => {
          const response = await getMergeRequests({
            page: params.current,
            pageSize: params.pageSize,
            status: params.status,
          });
          return {
            data: response.data,
            success: response.success,
            total: response.total,
          };
        }}
        columns={columns}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
      />

      <ModalForm
        title="创建合并请求"
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreate}
        width={500}
      >
        <ProFormText
          name="merge_url"
          label="合并链接"
          placeholder="请输入合并请求的链接，如：https://github.com/user/repo/pull/123"
          rules={[
            {
              required: true,
              message: '请输入合并链接',
            },
            {
              type: 'url',
              message: '请输入有效的URL地址',
            },
          ]}
        />

        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="请输入合并请求描述"
          fieldProps={{
            rows: 4,
          }}
        />

        <ProFormText
          name="repository_url"
          label="仓库地址"
          placeholder="选填：如 https://github.com/user/repo"
          rules={[
            {
              type: 'url',
              message: '请输入有效的URL地址',
            },
          ]}
        />

        <ProFormSelect
          name="status"
          label="状态"
          placeholder="请选择状态"
          options={[
            { label: '待处理', value: 'pending' },
            { label: '已批准', value: 'approved' },
            { label: '已拒绝', value: 'rejected' },
            { label: '已合并', value: 'merged' },
          ]}
          initialValue="pending"
        />
      </ModalForm>

      <ModalForm
        title="编辑合并请求"
        open={editModalVisible}
        onOpenChange={setEditModalVisible}
        onFinish={handleEdit}
        width={500}
        key={currentRecord?.id || 'new'}
        initialValues={currentRecord || {}}
      >
        <ProFormText
          name="merge_url"
          label="合并链接"
          placeholder="请输入合并请求的链接"
          rules={[
            {
              required: true,
              message: '请输入合并链接',
            },
            {
              type: 'url',
              message: '请输入有效的URL地址',
            },
          ]}
        />

        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="请输入合并请求描述"
          fieldProps={{
            rows: 4,
          }}
        />

        <ProFormText
          name="repository_url"
          label="仓库地址"
          placeholder="选填：如 https://github.com/user/repo"
          rules={[
            {
              type: 'url',
              message: '请输入有效的URL地址',
            },
          ]}
        />

        <ProFormSelect
          name="status"
          label="状态"
          placeholder="请选择状态"
          options={[
            { label: '待处理', value: 'pending' },
            { label: '已批准', value: 'approved' },
            { label: '已拒绝', value: 'rejected' },
            { label: '已合并', value: 'merged' },
          ]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default MergeRequestList;