import { PageContainer } from '@ant-design/pro-components';
import { Card, Row, Col, Statistic, DatePicker, Select, Space, Spin } from 'antd';
import { CheckCircleOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import dayjs, { Dayjs } from 'dayjs';
import {
  getOverallStatistics,
  getArchivedTasksByUser,
  getTasksByUser,
  getPostsByUser,
} from '@/services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Welcome: React.FC = () => {
  // 总体统计数据
  const [overallStats, setOverallStats] = useState({
    totalTasks: 0,
    totalArchivedTasks: 0,
    totalPosts: 0,
    totalUsers: 0,
  });
  const [overallLoading, setOverallLoading] = useState(false);

  // 已归档任务饼图数据
  const [archivedTasksData, setArchivedTasksData] = useState<any[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);

  // 用户任务柱状图数据
  const [tasksByUserData, setTasksByUserData] = useState<any[]>([]);
  const [tasksByUserLoading, setTasksByUserLoading] = useState(false);
  const [taskStatus, setTaskStatus] = useState<string | undefined>(undefined);
  const [taskYearMonth, setTaskYearMonth] = useState<[number, number] | null>(null);

  // 用户发帖数量柱状图数据（按周分组）
  const [postsByUserData, setPostsByUserData] = useState<{
    weeks: string[];
    series: Array<{ name: string; data: number[] }>;
  }>({ weeks: [], series: [] });
  const [postsByUserLoading, setPostsByUserLoading] = useState(false);
  const [postUserDateRange, setPostUserDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(3, 'months'),
    dayjs(),
  ]);

  // 加载总体统计
  const loadOverallStats = async () => {
    setOverallLoading(true);
    try {
      const res = await getOverallStatistics();
      if (res.success) {
        setOverallStats(res.data);
      }
    } catch (error) {
      console.error('加载总体统计失败:', error);
    } finally {
      setOverallLoading(false);
    }
  };

  // 加载已归档任务饼图
  const loadArchivedTasks = async () => {
    setArchivedLoading(true);
    try {
      const res = await getArchivedTasksByUser();
      if (res.success) {
        setArchivedTasksData(res.data);
      }
    } catch (error) {
      console.error('加载已归档任务失败:', error);
    } finally {
      setArchivedLoading(false);
    }
  };

  // 加载用户任务柱状图
  const loadTasksByUser = async () => {
    setTasksByUserLoading(true);
    try {
      const params: any = {};
      if (taskStatus) params.status = taskStatus;
      if (taskYearMonth) {
        params.year = taskYearMonth[0];
        params.month = taskYearMonth[1];
      }
      const res = await getTasksByUser(params);
      if (res.success) {
        setTasksByUserData(res.data);
      }
    } catch (error) {
      console.error('加载用户任务统计失败:', error);
    } finally {
      setTasksByUserLoading(false);
    }
  };

  // 加载用户发帖数量柱状图
  const loadPostsByUser = async () => {
    setPostsByUserLoading(true);
    try {
      const res = await getPostsByUser({
        startDate: postUserDateRange[0].format('YYYY-MM-DD'),
        endDate: postUserDateRange[1].format('YYYY-MM-DD'),
      });
      if (res.success) {
        setPostsByUserData(res.data);
      }
    } catch (error) {
      console.error('加载用户发帖统计失败:', error);
    } finally {
      setPostsByUserLoading(false);
    }
  };

  useEffect(() => {
    loadOverallStats();
    loadArchivedTasks();
  }, []);

  useEffect(() => {
    loadTasksByUser();
  }, [taskStatus, taskYearMonth]);

  useEffect(() => {
    loadPostsByUser();
  }, [postUserDateRange]);

  // 饼图配置
  const pieChartOption = {
    title: {
      text: '已归档任务用户占比',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    series: [
      {
        name: '任务数量',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {d}%',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: true,
        },
        data: archivedTasksData,
      },
    ],
  };

  // 用户任务柱状图配置
  const taskBarChartOption = {
    title: {
      text: '用户任务数量统计',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: tasksByUserData.map((item) => item.name),
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '任务数量',
        type: 'bar',
        data: tasksByUserData.map((item) => item.value),
        itemStyle: {
          color: '#5470c6',
        },
        label: {
          show: true,
          position: 'top',
        },
      },
    ],
  };

  // 用户发帖数量柱状图配置（按周堆叠）
  const postByUserChartOption = {
    title: {
      text: '用户发帖数量统计（按周）',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      top: 30,
      type: 'scroll',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '80px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: postsByUserData.weeks,
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: 'value',
    },
    series: postsByUserData.series.map((userSeries) => ({
      name: userSeries.name,
      type: 'bar',
      stack: 'total',
      data: userSeries.data,
      label: {
        show: true,
        formatter: (params: any) => (params.value > 0 ? params.value : ''),
      },
    })),
  };

  // 任务状态选项
  const taskStatusOptions = [
    { label: '全部', value: undefined },
    { label: '待办', value: 'todo' },
    { label: '进行中', value: 'in_progress' },
    { label: '开发完成', value: 'dev_complete' },
    { label: '测试中', value: 'testing' },
    { label: '已部署', value: 'deployed' },
    { label: '已归档', value: 'archived' },
  ];

  // 生成最近2年的月份选项
  const generateMonthOptions = () => {
    const options: Array<{ label: string; value: string | null }> = [
      { label: '全部', value: null },
    ];
    const now = dayjs();
    for (let i = 0; i < 24; i++) {
      const date = now.subtract(i, 'months');
      options.push({
        label: date.format('YYYY年MM月'),
        value: JSON.stringify([date.year(), date.month() + 1]),
      });
    }
    return options;
  };

  return (
    <PageContainer title="数据统计看板">
      <Spin spinning={overallLoading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总任务数"
                value={overallStats.totalTasks}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已归档任务"
                value={overallStats.totalArchivedTasks}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="发帖总数"
                value={overallStats.totalPosts}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="用户总数"
                value={overallStats.totalUsers}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Spin spinning={archivedLoading}>
              <ReactECharts
                option={pieChartOption}
                style={{ height: '400px' }}
                notMerge={true}
                lazyUpdate={true}
              />
            </Spin>
          </Card>
        </Col>

        <Col span={12}>
          <Card>
            <Space style={{ marginBottom: 16 }}>
              <span>任务状态：</span>
              <Select
                style={{ width: 150 }}
                value={taskStatus}
                onChange={(value) => setTaskStatus(value)}
                placeholder="选择状态"
              >
                {taskStatusOptions.map((opt) => (
                  <Option key={opt.label} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
              <span>月份：</span>
              <Select
                style={{ width: 150 }}
                value={taskYearMonth ? JSON.stringify(taskYearMonth) : undefined}
                onChange={(value) => {
                  setTaskYearMonth(value ? JSON.parse(value) : null);
                }}
                placeholder="选择月份"
              >
                {generateMonthOptions().map((opt) => (
                  <Option key={opt.label} value={opt.value || undefined}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Space>
            <Spin spinning={tasksByUserLoading}>
              <ReactECharts
                option={taskBarChartOption}
                style={{ height: '400px' }}
                notMerge={true}
                lazyUpdate={true}
              />
            </Spin>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card>
            <Space style={{ marginBottom: 16 }}>
              <span>时间范围：</span>
              <RangePicker
                value={postUserDateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setPostUserDateRange([dates[0], dates[1]]);
                  }
                }}
                disabledDate={(current) => {
                  return (
                    current &&
                    (current < dayjs().subtract(2, 'years') || current > dayjs())
                  );
                }}
              />
            </Space>
            <Spin spinning={postsByUserLoading}>
              <ReactECharts
                option={postByUserChartOption}
                style={{ height: '400px' }}
                notMerge={true}
                lazyUpdate={true}
              />
            </Spin>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Welcome;
