import { PageContainer } from '@ant-design/pro-components';
import { Card, Typography } from 'antd';
import React from 'react';

const { Title, Paragraph } = Typography;

const Welcome: React.FC = () => {
  return (
    <PageContainer>
      <Card>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Title level={2}>欢迎使用前端工作平台</Title>
          <Paragraph style={{ fontSize: '16px', marginTop: '20px' }}>
            这是一个高效的前端工作平台，具体多高效看大家怎么拓展开发了。。。
          </Paragraph>
          <Paragraph style={{ fontSize: '14px', color: '#666' }}>
            总而言之：大家有空一起来拓展啊
          </Paragraph>
        </div>
      </Card>
    </PageContainer>
  );
};

export default Welcome;