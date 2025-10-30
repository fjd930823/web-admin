import { PageContainer, ProForm, ProFormSelect, ProFormText, ProFormTextArea, ProFormDatePicker } from '@ant-design/pro-components';
import { Card, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { history } from '@umijs/max';
import { createTask, getUsers } from '@/services/api';

const CreateTask: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

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
      await createTask(values);
      message.success('创建成功');
      history.push('/tasks');
    } catch (error) {
      message.error('创建失败');
    }
  };

  return (
    <PageContainer>
      <Card>
        <ProForm
          onFinish={handleSubmit}
          layout="vertical"
          submitter={{
            searchConfig: {
              submitText: '创建',
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
            initialValue="todo"
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
            initialValue="medium"
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

export default CreateTask;