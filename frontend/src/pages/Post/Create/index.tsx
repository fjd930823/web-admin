import React, { useState, useRef, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Form, Input, Button, Space, message, Modal, Spin, Row, Col, List, Rate, Image, Empty, Tag, Select, Divider } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Editor } from '@tinymce/tinymce-react';
import { submitPost, searchContent, getSearchDetail } from '@/services/api';
import { getBoardTags, convertTagNamesToIds } from '@/utils/tagMapping';
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
  
  // 动态加载的标签映射
  const [boardTagsMap, setBoardTagsMap] = useState<Record<string, Record<string, string[]>>>({});

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

  // 处理板块变化，清空标签并动态加载标签选项
  const handleBoardChange = async (index: number, board: string) => {
    const newForms = [...forms];
    newForms[index].board = board;
    newForms[index].tags = []; // 清空标签
    setForms(newForms);
    
    // 如果该板块的标签还未加载，则加载
    if (board && !boardTagsMap[board]) {
      try {
        const tags = await getBoardTags(board);
        setBoardTagsMap(prev => ({
          ...prev,
          [board]: tags
        }));
      } catch (error) {
        console.error('加载板块标签失败:', error);
      }
    }
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

  // 解析账号（支持批量输入，每行一个账号）
  const parseAccounts = (accountsText: string): string[] => {
    const lines = accountsText.trim().split('\n');
    const accounts: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      accounts.push(trimmedLine);
    }
    
    return accounts;
  };

  // 提交所有表单
  const handleSubmitAll = async () => {
    // 验证表单
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      if (!form.accounts.trim()) {
        message.error(`第 ${i + 1} 个表单：请输入账号`);
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
          message.warning('账号格式不正确，已跳过');
          continue;
        }

        // 转换标签名称为ID
        const tagIds = await convertTagNamesToIds(form.board, form.tags);
        
        // 遍历提交每个账号
        for (const username of accounts) {
          try {
            await submitPost({
              username: username,
              title: form.title,
              board: form.board,
              tags: tagIds, // 已转换为逗号分隔的标签ID字符串
              content: form.content,
            });
            
            allResults.push({
              username: username,
              success: true,
            });
          } catch (error: any) {
            allResults.push({
              username: username,
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
                    label="账号（每行一个账号/手机号）"
                    required
                    tooltip="无需密码，系统将使用配置文件中的 token 进行发帖"
                  >
                    <TextArea
                      value={form.accounts}
                      onChange={(e) => updateForm(index, 'accounts', e.target.value)}
                      placeholder="示例：&#10;13800138000&#10;13900139000&#10;account1"
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
