import React, { useState, useRef } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Form, Input, Button, Space, message, Modal, Spin, Row, Col, List, Rate, Image, Empty, Tag, Select, Divider } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Editor } from '@tinymce/tinymce-react';
import { submitPost, searchContent, getSearchDetail } from '@/services/api';
import './index.less';

const { CheckableTag } = Tag;

const { TextArea } = Input;

interface PostForm {
  accounts: string;
  title: string;
  board: string;
  tags: string[];
  content: string;
}

interface SubmitResult {
  username: string;
  success: boolean;
  error?: string;
}

interface DoubanSearchItem {
  cover_url: string;
  title: string;
  rating: {
    value: number;
    count: number;
    star_count: number;
  };
  year: string;
  card_subtitle: string;
  id: string;
  uri: string;
  type_name?: string;
}

const PostCreate: React.FC = () => {
  const [forms, setForms] = useState<PostForm[]>([
    { accounts: '', title: '', board: '', tags: [], content: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<DoubanSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const editorRefs = useRef<any[]>([]);

  // 板块选项
  const boardOptions = [
    { label: '资源互助', value: '资源互助' },
    { label: '反馈', value: '反馈' },
    { label: '电影', value: '电影' },
    { label: '电视剧', value: '电视剧' },
    { label: '动漫', value: '动漫' },
    { label: '综艺', value: '综艺' },
    { label: '4K原盘', value: '4K原盘' },
    { label: '音频', value: '音频' },
    { label: '电子书', value: '电子书' },
    { label: '设计专区', value: '设计专区' },
    { label: '工具', value: '工具' },
    { label: '体育专区', value: '体育专区' },
  ];

  // 板块和标签的映射关系
  const boardTagsMap: Record<string, Record<string, string[]>> = {
    '资源互助': {
      '分类': ['求资源', '求搬运', '求帮助'],
      '状态': ['已解决', '未解决'],
      '资源类别': ['电影', '电视剧', '动漫', '综艺', '原盘', '音乐', '其他']
    },
    '反馈': {
      '分类': ['连接失效', '网站问题', '其他问题'],
      '状态': ['已解决', '未解决']
    },
    '电影': {
      '画质': ['480p', '720p', '1080p', '2K', '4K'],
      '类型': ['古装', '家庭', '恐怖', '灾难', '科幻', '动画', '纪录片', '历史', '剧情', '惊悚', '犯罪', '冒险', '奇幻', '悬疑', '爱情', '战争', '动作', '喜剧', '演唱会'],
      '地区': ['大陆', '香港', '台湾', '韩国', '日本', '欧美', '其他']
    },
    '电视剧': {
      '分辨率': ['480p', '720p', '1080p', '2K', '4K'],
      '资源来源': ['蓝光原盘/ISO', '蓝光原盘/REMUX', 'BDRip/BluRayEncode', 'WEB-DL/WEBRip', 'HDTV/HDRip'],
      '画质': ['杜比视界/DV', 'HDR', 'HQ', 'EDR', 'HLG', 'SDR', '60fps'],
      '类型': ['古装', '喜剧', '动作', '战争', '爱情', '悬疑', '奇幻', '冒险', '犯罪', '惊悚', '剧情', '历史', '纪录片', '动画'],
      '地区': ['大陆', '香港', '台湾', '韩国', '日本', '欧美', '其他'],
      '状态': ['完结', '更新中']
    },
    '动漫': {
      '分辨率': ['480p', '720p', '1080p', '2K', '4K', '8K'],
      '来源': ['BDRip/BluRayEncode', '蓝光原盘/REMUX', 'WEB-DL/WEBRip', '超分/AI修复', '蓝光原盘/ISO'],
      '类型': ['泡面', '校园', '悬疑', '恋爱', '魔法', '冒险', '历史', '机战', '百合', '运动', '励志', '音乐', '推理', '催泪', '治愈', '萌系', '耽美', '原创', '漫画改', '小说改', '游戏改', '热血', '穿越', '奇幻', '战斗', '搞笑', '日常', '科幻', '武侠', '偶像'],
      '地区': ['中国', '日本', '美国', '其他'],
      '状态': ['完结', '更新中'],
      '字幕语言': ['简中', '繁中', '简日双语', '繁日双语', '简英双语', '生肉'],
      '字幕种类': ['内封', '外挂', '内嵌']
    },
    '综艺': {
      '分类': ['脱口秀', '音乐舞台', '相声小品', '生活情感', '真人秀', '其他'],
      '地区': ['大陆', '港台', '韩国', '日本', '欧美', '其他'],
      '状态': ['完结', '更新中']
    },
    '4K原盘': {
      '分类': ['4K电影', '4K聚集', '4K纪录片', '4K演唱会', '4K其他'],
      '格式': ['MKV', 'ISO', 'BDMV', 'M2TS', 'TS', 'MP4']
    },
    '音频': {
      '分类': ['音乐', '有声读物', '有声小说', '相声评书', '广播剧', '电台'],
      '地区': ['内地', '港台', '日本', '韩国', '其他', '欧美'],
      '歌曲风格': ['R&B', 'Disco', '雷鬼', '民谣', '乡村', '古典', '摇滚', '流行', '说唱', '电子', 'ACG', '爵士', '朋克'],
      '有声类别': ['小说', '娱乐', '课程', '影视', '商业财经', '个人成长', '资讯', '悬疑', '人文文学', '历史', '经典名著'],
      '音频格式': ['WAV', 'MPEG', 'WAVE', 'CD', 'AMR', 'OGG', 'WMA', 'AAC', 'MP3', 'APE', 'ALAC', 'FLAC', 'SACD']
    },
    '电子书': {
      '分类': ['网络文学', '出版文学', '名人传记', '儿童读物', '影视原著', '人文社科', '经管励志', '轻小说', '漫画', '电子课程', '其他'],
      '格式': ['TXT', 'EPUB', 'MOBI', 'PDF', 'AZW3', '其他'],
      '地区': ['大陆', '港台', '日韩', '欧美', '其他']
    },
    '设计专区': {
      '分类': ['AI合成', '私模写真', '名站秀人', '高清壁纸', '其他', '设计教程']
    },
    '工具': {
      '工具': ['电脑', '手机', '其他']
    },
    '体育专区': {
      '其他': ['排球', '网球', '乒乓球', '其他运动'],
      '篮球': ['NBA', '国际篮球', '国内篮球', '篮球节目'],
      '足球': ['苏超', '英超', '德甲', '欧冠', '世界杯', '西甲', '意甲', '足球节目']
    }
  };

  // 获取当前板块的标签分组
  const getTagGroups = (board: string) => {
    if (!board || !boardTagsMap[board]) return [];
    return boardTagsMap[board];
  };

  // 切换标签选择
  const handleTagToggle = (index: number, category: string, tag: string, checked: boolean) => {
    const newForms = [...forms];
    const tagValue = `${category}:${tag}`;
    const currentTags = newForms[index].tags || [];
    
    if (checked) {
      // 添加标签
      if (!currentTags.includes(tagValue)) {
        newForms[index].tags = [...currentTags, tagValue];
      }
    } else {
      // 移除标签
      newForms[index].tags = currentTags.filter(t => t !== tagValue);
    }
    
    setForms(newForms);
  };

  // 添加新表单
  const addForm = () => {
    setForms([...forms, { accounts: '', title: '', board: '', tags: [], content: '' }]);
  };

  // 处理板块变化，清空标签
  const handleBoardChange = (index: number, board: string) => {
    const newForms = [...forms];
    newForms[index].board = board;
    newForms[index].tags = []; // 清空标签
    setForms(newForms);
  };

  // 删除表单
  const removeForm = (index: number) => {
    if (forms.length === 1) {
      message.warning('至少保留一个表单');
      return;
    }
    const newForms = forms.filter((_, i) => i !== index);
    setForms(newForms);
  };

  // 更新表单字段
  const updateForm = (index: number, field: keyof PostForm, value: any) => {
    const newForms = [...forms];
    newForms[index][field] = value;
    setForms(newForms);
  };

  // 解析账号密码（支持批量输入）
  const parseAccounts = (accountsText: string): Array<{ username: string; password: string }> => {
    const lines = accountsText.trim().split('\n');
    const accounts: Array<{ username: string; password: string }> = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // 支持多种分隔符：空格、制表符、逗号、冒号
      const parts = trimmedLine.split(/[\s\t,，:：]+/);
      if (parts.length >= 2) {
        accounts.push({
          username: parts[0].trim(),
          password: parts[1].trim(),
        });
      }
    }
    
    return accounts;
  };

  // 提交所有表单
  const handleSubmitAll = async () => {
    // 验证表单
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      if (!form.accounts.trim()) {
        message.error(`第 ${i + 1} 个表单：请输入账号密码`);
        return;
      }
      if (!form.title.trim()) {
        message.error(`第 ${i + 1} 个表单：请输入标题`);
        return;
      }
      if (!form.board) {
        message.error(`第 ${i + 1} 个表单：请选择板块`);
        return;
      }
      if (!form.content.trim()) {
        message.error(`第 ${i + 1} 个表单：请输入内容`);
        return;
      }
    }

    setSubmitting(true);
    const allResults: SubmitResult[] = [];

    try {
      // 遍历每个表单
      for (const form of forms) {
        const accounts = parseAccounts(form.accounts);
        
        if (accounts.length === 0) {
          message.warning('账号密码格式不正确，已跳过');
          continue;
        }

        // 遍历提交每个账号
        for (const account of accounts) {
          try {
            await submitPost({
              username: account.username,
              password: account.password,
              title: form.title,
              board: form.board,
              tags: form.tags.join(','), // 将标签数组转为逗号分隔的字符串
              content: form.content,
            });
            
            allResults.push({
              username: account.username,
              success: true,
            });
          } catch (error: any) {
            allResults.push({
              username: account.username,
              success: false,
              error: error.message || '提交失败',
            });
          }
        }
      }

      // 显示结果
      const successCount = allResults.filter(r => r.success).length;
      const failCount = allResults.filter(r => !r.success).length;
      
      if (failCount === 0) {
        message.success(`全部提交成功！共 ${successCount} 条`);
      } else {
        const failedList = allResults
          .filter(r => !r.success)
          .map(r => `${r.username}: ${r.error}`)
          .join('\n');
        
        Modal.error({
          title: `提交完成：成功 ${successCount} 条，失败 ${failCount} 条`,
          content: (
            <div>
              <p>失败的账号：</p>
              <pre style={{ maxHeight: '300px', overflow: 'auto' }}>{failedList}</pre>
            </div>
          ),
          width: 600,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 搜索豆瓣电影
  const handleSearch = async () => {
    if (!searchKeyword || !searchKeyword.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }

    setSearching(true);
    try {
      const response = await searchContent({ keyword: searchKeyword.trim() });
      const results: DoubanSearchItem[] = response.data || [];
      
      setSearchResults(results);

      if (results.length === 0) {
        message.info('未找到相关内容');
      }
    } catch (error) {
      message.error('搜索失败');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // 选择电影，获取详情
  const handleSelectMovie = async (movie: DoubanSearchItem) => {
    setLoadingDetail(true);
    try {
      const response = await getSearchDetail(movie.id);
      if (response.success && response.data) {
        setSelectedDetail(response.data);
      } else {
        message.error('获取详情失败: ' + (response.message || '未知错误'));
        setSelectedDetail(null);
      }
    } catch (error: any) {
      message.error('获取详情失败，请稍后重试');
      setSelectedDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // 获取代理后的图片URL
  const getProxyImageUrl = (originalUrl: string) => {
    if (!originalUrl) return '';
    return `/api/search/proxy-image?url=${encodeURIComponent(originalUrl)}`;
  };

  // 获取类型标签
  const getTypeTag = (typeName?: string) => {
    if (!typeName) return '其他';
    const typeMap: Record<string, string> = {
      '电影': '电影',
      '图书': '图书',
      '音乐': '音乐',
      '电视剧': '剧集',
    };
    return typeMap[typeName] || typeName;
  };

  return (
    <PageContainer title="发帖" className="post-create-page">
      <Row gutter={24}>
        {/* 左侧：发帖表单 */}
        <Col span={16}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {forms.map((form, index) => (
              <Card
                key={index}
                title={`表单 ${index + 1}`}
                extra={
                  forms.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => removeForm(index)}
                    >
                      删除
                    </Button>
                  )
                }
              >
                <Form layout="vertical">
                  <Form.Item
                    label="账号密码（每行一个，格式：账号 密码 或 账号,密码）"
                    required
                  >
                    <TextArea
                      value={form.accounts}
                      onChange={(e) => updateForm(index, 'accounts', e.target.value)}
                      placeholder="示例：&#10;user1 password1&#10;user2 password2&#10;user3,password3"
                      rows={4}
                    />
                  </Form.Item>

                  <Form.Item label="标题" required>
                    <Input
                      value={form.title}
                      onChange={(e) => updateForm(index, 'title', e.target.value)}
                      placeholder="请输入标题"
                    />
                  </Form.Item>

                  <Form.Item label="板块" required>
                    <Select
                      value={form.board || undefined}
                      onChange={(value) => handleBoardChange(index, value)}
                      placeholder="请选择发帖板块"
                      options={boardOptions}
                      size="large"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  <Form.Item 
                    label="标签" 
                    tooltip="点击选择标签，可多选"
                  >
                    {!form.board ? (
                      <div style={{ 
                        padding: '16px', 
                        background: '#f5f5f5', 
                        borderRadius: '4px',
                        color: '#999',
                        textAlign: 'center'
                      }}>
                        请先选择板块
                      </div>
                    ) : (
                      <div 
                        className="tags-select-area"
                        style={{ 
                          maxHeight: '400px', 
                          overflowY: 'scroll',
                          border: '1px solid #d9d9d9',
                          borderRadius: '4px',
                          padding: '12px'
                        }}
                      >
                        {Object.entries(getTagGroups(form.board)).map(([category, tags]) => (
                          <div key={category} style={{ marginBottom: '16px' }}>
                            <div style={{ 
                              marginBottom: '8px',
                              fontWeight: 'bold',
                              color: '#1890ff'
                            }}>
                              {category}
                            </div>
                            <Space size={[8, 8]} wrap>
                              {tags.map((tag: string) => {
                                const tagValue = `${category}:${tag}`;
                                const checked = (form.tags || []).includes(tagValue);
                                return (
                                  <CheckableTag
                                    key={tag}
                                    checked={checked}
                                    onChange={(checked) => handleTagToggle(index, category, tag, checked)}
                                    style={{
                                      border: '1px solid #d9d9d9',
                                      borderRadius: '4px',
                                      padding: '4px 12px',
                                      cursor: 'pointer',
                                      backgroundColor: checked ? '#1890ff' : '#fff',
                                      color: checked ? '#fff' : '#333',
                                      transition: 'all 0.3s'
                                    }}
                                  >
                                    {tag}
                                  </CheckableTag>
                                );
                              })}
                            </Space>
                            {Object.keys(getTagGroups(form.board)).indexOf(category) < 
                              Object.keys(getTagGroups(form.board)).length - 1 && (
                              <Divider style={{ margin: '12px 0' }} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {form.tags && form.tags.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ color: '#999', fontSize: '12px' }}>
                          已选 {form.tags.length} 个标签：
                        </span>
                        <div style={{ marginTop: '4px' }}>
                          {form.tags.map((tag, idx) => (
                            <Tag 
                              key={idx} 
                              color="blue"
                              closable
                              onClose={() => {
                                const [category, tagName] = tag.split(':');
                                handleTagToggle(index, category, tagName, false);
                              }}
                              style={{ marginBottom: '4px' }}
                            >
                              {tag.split(':')[1]}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </Form.Item>

                  <Form.Item label="内容" required>
                    <Editor
                      tinymceScriptSrc="https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js"
                      value={form.content}
                      onInit={(evt, editor) => {
                        editorRefs.current[index] = editor;
                      }}
                      onEditorChange={(content) => updateForm(index, 'content', content)}
                      init={{
                        height: 500,
                        menubar: true,
                        language: 'zh_CN',
                        language_url: 'https://cdn.jsdelivr.net/npm/tinymce-lang@1/langs/zh_CN.js',
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
                          'codesample'
                        ],
                        toolbar: 'undo redo | blocks | ' +
                          'bold italic forecolor backcolor | alignleft aligncenter ' +
                          'alignright alignjustify | bullist numlist outdent indent | ' +
                          'removeformat | table | link image media | code codesample | ' +
                          'fullscreen preview | emoticons | help',
                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                        branding: false,
                        promotion: false,
                        license_key: 'gpl',
                        code_dialog_height: 450,
                        code_dialog_width: 1000,
                        images_upload_handler: (blobInfo, progress) => new Promise((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            resolve(reader.result as string);
                          };
                          reader.onerror = () => reject('图片读取失败');
                          reader.readAsDataURL(blobInfo.blob());
                        }),
                        table_default_attributes: {
                          border: '1'
                        },
                        table_default_styles: {
                          'border-collapse': 'collapse',
                          'width': '100%'
                        },
                      }}
                    />
                  </Form.Item>
                </Form>
              </Card>
            ))}

            <Card>
              <Space>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={addForm}
                  block
                >
                  添加表单
                </Button>
                <Button
                  type="primary"
                  onClick={handleSubmitAll}
                  loading={submitting}
                  size="large"
                >
                  提交所有表单
                </Button>
              </Space>
            </Card>
          </Space>
        </Col>

        {/* 右侧：豆瓣搜索 */}
        <Col span={8}>
          <div style={{ position: 'sticky', top: '80px' }}>
            <Card 
              title="不花钱很慢的搜索" 
              bordered
              className="search-panel-card"
              style={{ 
                height: 'calc(100vh - 160px)',
                display: 'flex',
                flexDirection: 'column'
              }}
              bodyStyle={{
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                {/* 搜索框 */}
                <Space.Compact style={{ width: '100%', marginBottom: '12px' }}>
                  <Input
                    placeholder="输入电影名称搜索..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onPressEnter={handleSearch}
                    size="large"
                  />
                  <Button 
                    type="primary" 
                    icon={<SearchOutlined />} 
                    onClick={handleSearch} 
                    loading={searching}
                    size="large"
                  >
                    搜索
                  </Button>
                </Space.Compact>

                {/* 搜索结果列表 - 只在没有选中详情时显示 */}
                {!selectedDetail && (
                  <Spin spinning={searching} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div 
                      className="search-results-container"
                      style={{ 
                        flex: 1,
                        overflowY: 'scroll',
                        overflowX: 'hidden',
                        paddingRight: '8px',
                        minHeight: 0,
                        maxHeight: '100%',
                      }}
                    >
                      {searchResults.length > 0 ? (
                        <List
                          dataSource={searchResults}
                          split={false}
                          renderItem={(item) => (
                            <List.Item
                              style={{ 
                                padding: '12px',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                transition: 'all 0.3s',
                              }}
                              className="search-result-item"
                              onClick={() => handleSelectMovie(item)}
                            >
                              <List.Item.Meta
                                avatar={
                                  <Image
                                    src={getProxyImageUrl(item.cover_url)}
                                    alt={item.title}
                                    width={60}
                                    height={85}
                                    style={{ 
                                      objectFit: 'cover', 
                                      borderRadius: '4px',
                                    }}
                                    preview={false}
                                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                                  />
                                }
                                title={
                                  <div style={{ 
                                    fontWeight: 'bold', 
                                    marginBottom: '4px',
                                    fontSize: '14px',
                                    lineHeight: '1.4'
                                  }}>
                                    <Tag color={item.type_name === '电影' ? 'blue' : item.type_name === '图书' ? 'green' : 'default'} style={{ marginRight: '8px' }}>
                                      {getTypeTag(item.type_name)}
                                    </Tag>
                                    {item.title}
                                  </div>
                                }
                                description={
                                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                    <div>
                                      <Rate 
                                        disabled 
                                        value={item.rating?.value ? item.rating.value / 2 : 0} 
                                        style={{ fontSize: '14px' }}
                                      />
                                      <span style={{ marginLeft: '8px', color: '#faad14', fontWeight: 'bold' }}>
                                        {item.rating?.value || '暂无评分'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#999' }}>
                                      {item.card_subtitle || item.year}
                                    </div>
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      ) : (
                        !searching && (
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="输入关键词开始搜索"
                            style={{ marginTop: '60px' }}
                          />
                        )
                      )}
                    </div>
                  </Spin>
                )}

                {/* 详情展示区域 - 只在选中时显示，占满整个空间 */}
                {selectedDetail && (
                  <div 
                    className="detail-content-area"
                    style={{ 
                      flex: 1,
                      overflowY: 'scroll',
                      minHeight: 0,
                      maxHeight: '100%',
                    }}
                  >
                    <Spin spinning={loadingDetail}>
                      <div style={{ marginBottom: '12px' }}>
                        <Button 
                          type="default" 
                          onClick={() => setSelectedDetail(null)}
                          icon={<SearchOutlined />}
                        >
                          返回搜索
                        </Button>
                      </div>
                      <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '8px' }}>
                        {/* 顶部：标题和封面图 */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                          {selectedDetail.image && (
                            <Image
                              src={getProxyImageUrl(selectedDetail.image)}
                              alt={selectedDetail.name}
                              width={150}
                              height={210}
                              style={{ 
                                objectFit: 'cover', 
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }}
                              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <h2 style={{ marginTop: 0, marginBottom: '12px' }}>{selectedDetail.name}</h2>
                            {selectedDetail.rating && (
                              <div style={{ marginBottom: '8px' }}>
                                <Rate disabled value={selectedDetail.rating / 2} style={{ fontSize: '16px' }} />
                                <span style={{ marginLeft: '8px', color: '#faad14', fontWeight: 'bold', fontSize: '18px' }}>
                                  {selectedDetail.rating}
                                </span>
                                <span style={{ marginLeft: '8px', color: '#999', fontSize: '14px' }}>
                                  ({selectedDetail.ratingCount}人评价)
                                </span>
                              </div>
                            )}
                            {selectedDetail.genre && (
                              <div style={{ marginBottom: '8px' }}>
                                {selectedDetail.genre.split(' / ').map((g: string, i: number) => (
                                  <Tag key={i} color="blue" style={{ marginBottom: '4px' }}>{g}</Tag>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 详细信息 - 逐行显示 */}
                        <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                          {selectedDetail.datePublished && (
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ color: '#666', marginRight: '8px' }}>上映时间：</span>
                              <span>{selectedDetail.datePublished}</span>
                            </div>
                          )}
                          {selectedDetail.director && (
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ color: '#666', marginRight: '8px' }}>导演：</span>
                              <span>{selectedDetail.director}</span>
                            </div>
                          )}
                          {selectedDetail.author && (
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ color: '#666', marginRight: '8px' }}>编剧：</span>
                              <span>{selectedDetail.author}</span>
                            </div>
                          )}
                          {selectedDetail.actor && (
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ color: '#666', marginRight: '8px' }}>主演：</span>
                              <span>{selectedDetail.actor}</span>
                            </div>
                          )}
                          {selectedDetail.country && (
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ color: '#666', marginRight: '8px' }}>制片国家：</span>
                              <span>{selectedDetail.country}</span>
                            </div>
                          )}
                          {selectedDetail.language && (
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ color: '#666', marginRight: '8px' }}>语言：</span>
                              <span>{selectedDetail.language}</span>
                            </div>
                          )}
                          {selectedDetail.duration && (
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ color: '#666', marginRight: '8px' }}>片长：</span>
                              <span>{selectedDetail.duration}</span>
                            </div>
                          )}
                          {selectedDetail.aka && (
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ color: '#666', marginRight: '8px' }}>别名：</span>
                              <span>{selectedDetail.aka}</span>
                            </div>
                          )}
                          {selectedDetail.description && (
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e8e8e8' }}>
                              <div style={{ color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>剧情简介：</div>
                              <div style={{ lineHeight: '1.8', color: '#333' }}>{selectedDetail.description}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Spin>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default PostCreate;
