import React, { useState, useEffect } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Tag, DatePicker, Select } from 'antd';
import dayjs from 'dayjs';
import { getOperationLogs } from '@/services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const OperationLogs: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs(),
  ]);

  // 操作类型颜色映射
  const actionColorMap: Record<string, string> = {
    view: 'blue',
    create: 'green',
    update: 'orange',
    delete: 'red',
    login: 'purple',
    logout: 'default',
    export: 'cyan',
    import: 'magenta',
  };

  // 状态码颜色映射
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 400 && status < 500) return 'warning';
    if (status >= 500) return 'error';
    return 'default';
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
      search: false,
    },
    {
      title: '用户',
      dataIndex: 'username',
      width: 120,
      search: true,
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      width: 100,
      valueType: 'select',
      valueEnum: {
        view: { text: '查看' },
        create: { text: '创建' },
        update: { text: '更新' },
        delete: { text: '删除' },
        login: { text: '登录' },
        logout: { text: '登出' },
        export: { text: '导出' },
        import: { text: '导入' },
      },
      render: (_: any, record: any) => (
        <Tag color={actionColorMap[record.action] || 'default'}>
          {record.action}
        </Tag>
      ),
    },
    {
      title: '模块',
      dataIndex: 'module',
      width: 120,
      valueType: 'select',
      valueEnum: {
        users: { text: '用户管理' },
        tasks: { text: '任务看板' },
        posts: { text: '发帖管理' },
        tokens: { text: 'Token管理' },
        'merge-requests': { text: '合并请求' },
        statistics: { text: '统计' },
      },
    },
    {
      title: '请求方法',
      dataIndex: 'method',
      width: 80,
      search: false,
      render: (method: string) => {
        const colorMap: Record<string, string> = {
          GET: 'blue',
          POST: 'green',
          PUT: 'orange',
          DELETE: 'red',
          PATCH: 'purple',
        };
        return <Tag color={colorMap[method]}>{method}</Tag>;
      },
    },
    {
      title: '请求路径',
      dataIndex: 'path',
      ellipsis: true,
      search: false,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      width: 140,
      search: false,
    },
    {
      title: '状态码',
      dataIndex: 'status_code',
      width: 90,
      search: false,
      render: (status: number) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: '耗时(ms)',
      dataIndex: 'duration',
      width: 100,
      search: false,
      sorter: true,
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      width: 180,
      valueType: 'dateTime',
      search: false,
    },
  ];

  return (
    <PageContainer>
      <ProTable
        columns={columns}
        request={async (params, sort, filter) => {
          try {
            const res = await getOperationLogs({
              page: params.current,
              pageSize: params.pageSize,
              username: params.username,
              action: params.action,
              module: params.module,
              startDate: dateRange[0].format('YYYY-MM-DD'),
              endDate: dateRange[1].format('YYYY-MM-DD'),
            });

            if (res.success) {
              return {
                data: res.data,
                success: true,
                total: res.total,
              };
            }
            return {
              data: [],
              success: false,
              total: 0,
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
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        search={{
          labelWidth: 'auto',
        }}
        dateFormatter="string"
        headerTitle="操作日志"
        toolBarRender={() => [
          <RangePicker
            key="dateRange"
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
            disabledDate={(current) => current && current > dayjs()}
          />,
        ]}
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ padding: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>User Agent:</strong>
                <div style={{ marginTop: '4px', color: '#666', fontSize: '12px' }}>
                  {record.user_agent || '-'}
                </div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>请求参数:</strong>
                <pre
                  style={{
                    marginTop: '4px',
                    padding: '8px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '12px',
                    maxHeight: '200px',
                    overflow: 'auto',
                  }}
                >
                  {record.params ? JSON.stringify(JSON.parse(record.params), null, 2) : '-'}
                </pre>
              </div>
              {record.error_message && (
                <div>
                  <strong>错误信息:</strong>
                  <div
                    style={{
                      marginTop: '4px',
                      color: '#ff4d4f',
                      fontSize: '12px',
                    }}
                  >
                    {record.error_message}
                  </div>
                </div>
              )}
            </div>
          ),
        }}
      />
    </PageContainer>
  );
};

export default OperationLogs;
