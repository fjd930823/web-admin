import { PlusOutlined, TableOutlined, AppstoreOutlined, FilterOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Tag, message, Segmented, Empty, Popconfirm, Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { history } from '@umijs/max';
import { getTasks, updateTaskStatus, deleteTask, getUsers, type Task } from '@/services/api';
import './index.less';

const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [users, setUsers] = useState<any[]>([]);
  const [filterAssignee, setFilterAssignee] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterYear, setFilterYear] = useState<number | undefined>();
  const [filterMonth, setFilterMonth] = useState<number | undefined>();

  const columns = [
    { key: 'todo', title: '待开发', color: '#d9d9d9' },
    { key: 'in_progress', title: '进行中', color: '#1890ff' },
    { key: 'dev_complete', title: '开发完成', color: '#52c41a' },
    { key: 'testing', title: '测试中', color: '#faad14' },
    { key: 'deployed', title: '已上线', color: '#722ed1' },
    { key: 'archived', title: '已归档', color: '#8c8c8c' },
  ];

  // 看板视图不显示已归档
  const boardColumns = columns.filter(col => col.key !== 'archived');

  const priorityConfig = {
    low: { text: '低', color: 'default' },
    medium: { text: '中', color: 'blue' },
    high: { text: '高', color: 'orange' },
    urgent: { text: '紧急', color: 'red' },
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params: any = { pageSize: 1000 };
      if (filterAssignee !== undefined) {
        params.assignee_id = filterAssignee;
      }
      if (filterStatus) {
        params.status = filterStatus;
      }
      if (filterYear) {
        params.year = filterYear;
      }
      if (filterMonth) {
        params.month = filterMonth;
      }
      const response = await getTasks(params);
      setTasks(response.data);
    } catch (error) {
      message.error('获取任务失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getUsers({ pageSize: 100 });
      setUsers(response.data);
    } catch (error) {
      console.error('获取用户列表失败');
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filterAssignee, filterStatus, filterYear, filterMonth]);

  useEffect(() => {
    // 切换到看板视图时，清除状态和日期筛选
    if (viewMode === 'board') {
      if (filterStatus) setFilterStatus(undefined);
      if (filterYear) setFilterYear(undefined);
      if (filterMonth) setFilterMonth(undefined);
    }
  }, [viewMode]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', String(task.id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    try {
      await updateTaskStatus(Number(taskId), newStatus);
      message.success('状态更新成功');
      fetchTasks();
    } catch (error: any) {
      message.error(error.message || '状态更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTask(id);
      message.success('删除成功');
      fetchTasks();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const handleResetFilters = () => {
    setFilterAssignee(undefined);
    setFilterStatus(undefined);
    setFilterYear(undefined);
    setFilterMonth(undefined);
  };

  // 生成年份选项（最近5年）
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    label: `${currentYear - i}年`,
    value: currentYear - i,
  }));

  // 月份选项
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 1}月`,
    value: i + 1,
  }));

  const renderBoardView = () => (
    <div className="task-board">
      {boardColumns.map(column => (
        <div
          key={column.key}
          className="task-column"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.key)}
        >
          <div className="column-header" style={{ borderTopColor: column.color }}>
            <span className="column-title">{column.title}</span>
            <span className="column-count">{getTasksByStatus(column.key).length}</span>
          </div>
          <div className="column-content">
            {getTasksByStatus(column.key).length === 0 ? (
              <Empty description="暂无任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              getTasksByStatus(column.key).map(task => (
                <Card
                  key={task.id}
                  className="task-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  size="small"
                  hoverable
                >
                  <div className="task-card-header">
                    <span className="task-title">{task.title}</span>
                    <Tag color={priorityConfig[task.priority as keyof typeof priorityConfig]?.color}>
                      {priorityConfig[task.priority as keyof typeof priorityConfig]?.text}
                    </Tag>
                  </div>
                  {task.description && (
                    <div className="task-description">{task.description}</div>
                  )}
                  <div className="task-card-footer">
                    <span className="task-assignee">
                      {task.assignee_name || '未分配'}
                    </span>
                    <div className="task-actions">
                      <Button
                        type="link"
                        size="small"
                        onClick={() => history.push(`/tasks/edit/${task.id}`)}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        title="确定要删除这个任务吗？"
                        onConfirm={() => handleDelete(task.id!)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button type="link" size="small" danger>
                          删除
                        </Button>
                      </Popconfirm>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderTableView = () => (
    <div className="task-table">
      {tasks.length === 0 ? (
        <Empty description="暂无任务" />
      ) : (
        tasks.map(task => {
          const column = columns.find(c => c.key === task.status);
          return (
            <Card key={task.id} className="task-row" size="small">
              <div className="task-row-content">
                <div className="task-info">
                  <Tag color={column?.color}>{column?.title}</Tag>
                  <span className="task-title">{task.title}</span>
                  <Tag color={priorityConfig[task.priority as keyof typeof priorityConfig]?.color}>
                    {priorityConfig[task.priority as keyof typeof priorityConfig]?.text}
                  </Tag>
                </div>
                <div className="task-meta">
                  <span>负责人: {task.assignee_name || '未分配'}</span>
                  <span>创建人: {task.creator_name}</span>
                  <span>开始: {formatDate(task.start_date)}</span>
                  <span>截止: {formatDate(task.due_date)}</span>
                  <div className="task-actions">
                    <Button
                      type="link"
                      size="small"
                      onClick={() => history.push(`/tasks/edit/${task.id}`)}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定要删除这个任务吗？"
                      onConfirm={() => handleDelete(task.id!)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="link" size="small" danger>
                        删除
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );

  return (
    <PageContainer
      extra={[
        <Space key="filters" size="middle">
          <Select
            placeholder="按负责人筛选"
            style={{ width: 150 }}
            allowClear
            value={filterAssignee}
            onChange={setFilterAssignee}
            options={[
              { label: '未分配', value: 0 },
              ...users.map(user => ({
                label: user.username,
                value: user.id,
              })),
            ]}
          />
          {viewMode === 'table' && (
            <>
              <Select
                placeholder="按状态筛选"
                style={{ width: 120 }}
                allowClear
                value={filterStatus}
                onChange={setFilterStatus}
                options={columns.map(col => ({
                  label: col.title,
                  value: col.key,
                }))}
              />
              <Select
                placeholder="选择年份"
                style={{ width: 110 }}
                allowClear
                value={filterYear}
                onChange={(value) => {
                  setFilterYear(value);
                  if (!value) setFilterMonth(undefined);
                }}
                options={yearOptions}
              />
              {filterYear && (
                <Select
                  placeholder="选择月份"
                  style={{ width: 100 }}
                  allowClear
                  value={filterMonth}
                  onChange={setFilterMonth}
                  options={monthOptions}
                />
              )}
            </>
          )}
          {(filterAssignee !== undefined || filterStatus || filterYear || filterMonth) && (
            <Button onClick={handleResetFilters}>
              重置筛选
            </Button>
          )}
        </Space>,
        <Segmented
          key="view"
          value={viewMode}
          onChange={(value) => setViewMode(value as 'board' | 'table')}
          options={[
            { label: '看板', value: 'board', icon: <AppstoreOutlined /> },
            { label: '列表', value: 'table', icon: <TableOutlined /> },
          ]}
        />,
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => history.push('/tasks/create')}
        >
          新建任务
        </Button>,
      ]}
    >
      {viewMode === 'board' ? renderBoardView() : renderTableView()}
    </PageContainer>
  );
};

export default TaskBoard;