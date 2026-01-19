import React, { useRef, useState, useEffect } from 'react';
import { PageContainer, ProTable, ProColumns } from '@ant-design/pro-components';
import { Modal, Tag, Button, message, Space } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ActionType } from '@ant-design/pro-components';
import { getPostHistory, deletePost, Post } from '@/services/api';
import { useModel } from '@umijs/max';
import { convertTagIdsToNames } from '@/utils/tagMapping';

// 标签显示组件（异步加载标签名称）
const TagsDisplay: React.FC<{ boardName: string; tagIds: string }> = ({ boardName, tagIds }) => {
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTags = async () => {
      if (!tagIds || !boardName) {
        setLoading(false);
        return;
      }
      try {
        const names = await convertTagIdsToNames(boardName, tagIds);
        setTagNames(names);
      } catch (error) {
        console.error('加载标签名称失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTags();
  }, [boardName, tagIds]);

  if (loading) {
    return <Tag>加载中...</Tag>;
  }

  if (tagNames.length === 0) {
    return <span>-</span>;
  }

  return (
    <Space size={[0, 4]} wrap>
      {tagNames.slice(0, 3).map((name, idx) => (
        <Tag key={idx} color="cyan" style={{ fontSize: '12px' }}>
          {name}
        </Tag>
      ))}
      {tagNames.length > 3 && <Tag>+{tagNames.length - 3}</Tag>}
    </Space>
  );
};

const PostHistory: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  // 查看详情
  const handleView = (record: Post) => {
    setSelectedPost(record);
    setViewModalVisible(true);
  };

  // 删除记录
  const handleDelete = (record: Post) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除账号 "${record.username}" 的发帖记录吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deletePost(record.id!);
          message.success('删除成功');
          actionRef.current?.reload();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const columns: ProColumns<Post>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
      sorter: true,
    },
    {
      title: '账号',
      dataIndex: 'username',
      width: 150,
      copyable: true,
      fieldProps: {
        placeholder: '请输入账号',
      },
    },
    {
      title: '创建者',
      dataIndex: 'creator',
      width: 120,
      search: false,
      render: (_, record) => {
        if (record.creator) {
          return (
            <Space direction="vertical" size={0}>
              <span style={{ fontWeight: 500 }}>{record.creator.username}</span>
              <span style={{ fontSize: '12px', color: '#999' }}>{record.creator.email}</span>
            </Space>
          );
        }
        return <span style={{ color: '#999' }}>-</span>;
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 200,
      ellipsis: true,
      copyable: true,
      fieldProps: {
        placeholder: '请输入标题关键词',
      },
    },
    {
      title: '板块',
      dataIndex: 'board',
      width: 120,
      search: false,
      render: (text) => <Tag color="blue">{text || '资源互助'}</Tag>,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 200,
      search: false,
      ellipsis: true,
      render: (text, record) => {
        if (!text || typeof text !== 'string') return '-';
        // 使用异步组件显示标签名称
        return <TagsDisplay boardName={record.board} tagIds={text} />;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      valueEnum: {
        success: {
          text: '成功',
          status: 'Success',
        },
        failed: {
          text: '失败',
          status: 'Error',
        },
        no_token: {
          text: '无Token',
          status: 'Warning',
        },
        token_expired: {
          text: 'Token过期',
          status: 'Warning',
        },
      },
      render: (_, record) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
          success: { color: 'success', text: '成功' },
          failed: { color: 'error', text: '失败' },
          no_token: { color: 'warning', text: '无Token' },
          token_expired: { color: 'warning', text: 'Token过期' },
        };
        const config = statusConfig[record.status || 'success'] || { color: 'default', text: record.status || '未知' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      width: 200,
      ellipsis: true,
      search: false,
      render: (text) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      valueType: 'dateTime',
      search: false,
      sorter: true,
      defaultSortOrder: 'descend',
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      search: false,
      render: (_, record) => {
        const actions = [
          <Button
            key="view"
            type="link"
            size="small"
            onClick={() => handleView(record)}
          >
            查看内容
          </Button>,
        ];
        
        // 只有管理员可以删除
        if (currentUser && currentUser.role === 'admin') {
          actions.push(
            <Button
              key="delete"
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          );
        }
        
        return actions;
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<Post>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params, sort, filter) => {
          try {
            // 处理排序
            let sortField: string | undefined = undefined;
            let sortOrder: string | undefined = undefined;
            if (sort && Object.keys(sort).length > 0) {
              const sortKey = Object.keys(sort)[0];
              sortField = sortKey;
              sortOrder = sort[sortKey] === 'ascend' ? 'asc' : 'desc';
            }

            const response = await getPostHistory({
              page: params.current,
              pageSize: params.pageSize,
              status: params.status,
              username: params.username,
              title: params.title,
              sortField,
              sortOrder,
            });
            return {
              data: response.data || [],
              success: true,
              total: response.total || 0,
            };
          } catch (error) {
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        dateFormatter="string"
        headerTitle="发帖记录"
        toolBarRender={() => [
          <Button
            key="refresh"
            onClick={() => {
              actionRef.current?.reload();
            }}
          >
            刷新
          </Button>,
        ]}
      />

      {/* 查看内容Modal */}
      <Modal
        title="发帖内容详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedPost && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <strong>账号：</strong>{selectedPost.username}
            </div>
            {selectedPost.creator && (
              <div>
                <strong>创建者：</strong>
                <Tag color="blue">{selectedPost.creator.username}</Tag>
                <span style={{ color: '#999', marginLeft: '8px' }}>{selectedPost.creator.email}</span>
              </div>
            )}
            <div>
              <strong>标题：</strong>{selectedPost.title}
            </div>
            <div>
              <strong>板块：</strong>
              <Tag color="blue">{selectedPost.board || '资源互助'}</Tag>
            </div>
            {selectedPost.tags && typeof selectedPost.tags === 'string' && (
              <div>
                <strong>标签：</strong>
                <div style={{ marginTop: '8px' }}>
                  <TagsDisplay boardName={selectedPost.board} tagIds={selectedPost.tags} />
                </div>
              </div>
            )}
            <div>
              <strong>状态：</strong>
              <Tag color={
                selectedPost.status === 'success' ? 'success' :
                selectedPost.status === 'no_token' || selectedPost.status === 'token_expired' ? 'warning' :
                'error'
              }>
                {
                  selectedPost.status === 'success' ? '成功' :
                  selectedPost.status === 'failed' ? '失败' :
                  selectedPost.status === 'no_token' ? '无Token' :
                  selectedPost.status === 'token_expired' ? 'Token过期' :
                  selectedPost.status || '未知'
                }
              </Tag>
            </div>
            {selectedPost.error_message && (
              <div>
                <strong>错误信息：</strong>
                <span style={{ color: '#ff4d4f' }}>{selectedPost.error_message}</span>
              </div>
            )}
            <div>
              <strong>内容：</strong>
              <div
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  maxHeight: '400px',
                  overflow: 'auto',
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
              </div>
            </div>
            <div>
              <strong>创建时间：</strong>{selectedPost.created_at}
            </div>
          </Space>
        )}
      </Modal>
    </PageContainer>
  );
};

export default PostHistory;
