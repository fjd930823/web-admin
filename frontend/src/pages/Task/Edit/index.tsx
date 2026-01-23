import { PageContainer, ProForm, ProFormSelect, ProFormText, ProFormTextArea, ProFormDatePicker } from '@ant-design/pro-components';
import { Card, message, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { history, useParams } from '@umijs/max';
import { getTask, updateTask, getUsers } from '@/services/api';

const EditTask: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState<any>();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, [id]);

  const fetchData = async () => {
    try {
      const response = await getTask(Number(id));
      const data = response.data;
      setInitialValues({
        ...data,
        // ProFormDatePicker 可以直接使用字符串
        start_date: data.start_date,
        due_date: data.due_date,
      });
    } catch (error) {
      message.error('获取数据失败');
      history.push('/tasks');
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

  const handleSubmit = async (values: any) => {
    try {
      await updateTask(Number(id), values);
      message.success('更新成功');
      history.push('/tasks');
    } catch (error) {
      message.error('更新失败');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <Spin size="large" style={{ display: 'block', textAlign: 'center', padding: '50px' }} />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Card>
        <ProForm
          initialValues={initialValues}
          onFinish={handleSubmit}
          layout="vertical"
          submitter={{
            searchConfig: {
              submitText: '更新',
            },
            resetButtonProps: {
              style: {
                display: 'none',
              },
            },
          }}
        >
          <ProFormText
            name="title"
            label="任务标题"
            placeholder="请输入任务标题"
            rules={[
              {
                required: true,
                message: '请输入任务标题',
              },
            ]}
          />
          
          <ProFormTextArea
            name="description"
            label="任务描述"
            placeholder="请输入任务描述"
            fieldProps={{
              rows: 4,
            }}
          />

          <ProFormSelect
            name="status"
            label="状态"
            placeholder="请选择状态"
            options={[
              { label: '待开发', value: 'todo' },
              { label: '进行中', value: 'in_progress' },
              { label: '开发完成', value: 'dev_complete' },
              { label: '测试中', value: 'testing' },
              { label: '已上线', value: 'deployed' },
              { label: '已归档', value: 'archived' },
            ]}
          />

          <ProFormSelect
            name="priority"
            label="优先级"
            placeholder="请选择优先级"
            options={[
              { label: '低', value: 'low' },
              { label: '中', value: 'medium' },
              { label: '高', value: 'high' },
              { label: '紧急', value: 'urgent' },
            ]}
          />

          <ProFormSelect
            name="assignee_id"
            label="负责人"
            placeholder="请选择负责人"
            options={users.map(user => ({
              label: user.username,
              value: user.id,
            }))}
          />

          <ProFormDatePicker
            name="start_date"
            label="开始日期"
            placeholder="请选择开始日期"
          />

          <ProFormDatePicker
            name="due_date"
            label="截止日期"
            placeholder="请选择截止日期"
          />
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default EditTask;