import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Layout,
  Menu,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  AlertOutlined,
  BarChartOutlined,
  BookOutlined,
  BugOutlined,
  CloudOutlined,
  CloudUploadOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  HomeOutlined,
  InboxOutlined,
  LineChartOutlined,
  LogoutOutlined,
  NodeIndexOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  WechatOutlined,
} from '@ant-design/icons'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  },
)

type AnyRecord = Record<string, any>

const roleLabels: AnyRecord = {
  admin: '系统管理员',
  org_admin: '合作社管理员',
  farmer: '农户',
  expert: '农技专家',
}

const dataSourceLabels: AnyRecord = {
  manual: '手动录入',
  import: '批量导入',
  sensor: '传感器',
  weather: '气象数据',
  expert: '专家录入',
  demo: '演示数据',
}

const dataSourceColors: AnyRecord = {
  manual: 'blue',
  import: 'purple',
  sensor: 'green',
  weather: 'cyan',
  expert: 'gold',
  demo: 'orange',
}

const confidenceLabels: AnyRecord = { high: '高可信', medium: '中可信', low: '低可信' }
const confidenceColors: AnyRecord = { high: 'green', medium: 'blue', low: 'orange' }

const reviewStatusLabels: AnyRecord = { pending: '待审核', approved: '已批准', rejected: '已驳回', modified: '已修改' }
const reviewStatusColors: AnyRecord = { pending: 'default', approved: 'green', rejected: 'red', modified: 'blue' }

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据驾驶舱' },
  { key: '/plots', icon: <HomeOutlined />, label: '地块管理' },
  { key: '/environment', icon: <LineChartOutlined />, label: '环境监测' },
  { key: '/warnings', icon: <AlertOutlined />, label: '智能预警' },
  { key: '/decision', icon: <ExperimentOutlined />, label: '智能决策' },
  { key: '/growth-records', icon: <BarChartOutlined />, label: '田间巡查' },
  { key: '/comparison', icon: <NodeIndexOutlined />, label: '成果对比' },
  { key: '/diagnosis', icon: <BugOutlined />, label: '病虫害诊断' },
  { key: '/farming-logs', icon: <CloudUploadOutlined />, label: '农事日志' },
  { key: '/weather', icon: <CloudOutlined />, label: '天气数据' },
  { key: '/reports', icon: <FilePdfOutlined />, label: '数据报表' },
  { key: '/knowledge', icon: <BookOutlined />, label: '农事知识库' },
  { key: '/users', icon: <TeamOutlined />, label: '用户管理' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
]

function useAuth() {
  const [user, setUser] = useState<AnyRecord | null>(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })

  const login = (token: string, nextUser: AnyRecord) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return { user, login, logout }
}

function AuthPage({ mode, onLogin }: { mode: 'login' | 'register'; onLogin: (token: string, user: AnyRecord) => void }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const submit = async (values: AnyRecord) => {
    setLoading(true)
    try {
      if (mode === 'register') {
        await api.post('/auth/register', values)
        message.success('注册成功，请登录')
        navigate('/login')
      } else {
        const { data } = await api.post('/auth/login', values)
        onLogin(data.access_token, data.user)
        navigate('/dashboard')
      }
    } catch (error: any) {
      message.error(error.response?.data?.detail || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="brand-mark">茶</div>
        <Typography.Title level={1}>山茶智耘</Typography.Title>
        <Typography.Paragraph>油茶全周期智慧监测与管理决策系统</Typography.Paragraph>
        <div className="auth-metrics">
          <span>环境监测</span>
          <span>智能预警</span>
          <span>农事决策</span>
          <span>成果评估</span>
        </div>
      </div>
      <Card className="auth-card">
        <Typography.Title level={3}>{mode === 'login' ? '账号登录' : '创建账号'}</Typography.Title>
        <Form layout="vertical" onFinish={submit} initialValues={{ role: 'farmer' }}>
          <Form.Item name="username" label="用户名 / 手机号" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input size="large" prefix={<UserOutlined />} placeholder="admin" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password size="large" placeholder={mode === 'login' ? 'Admin@123456' : '至少 6 位'} />
          </Form.Item>
          {mode === 'register' && (
            <>
              <Form.Item name="phone" label="手机号">
                <Input size="large" />
              </Form.Item>
              <Form.Item name="role" label="角色">
                <Select size="large" options={Object.entries(roleLabels).filter(([k]) => k !== 'admin').map(([value, label]) => ({ value, label }))} />
              </Form.Item>
            </>
          )}
          <Button type="primary" size="large" htmlType="submit" loading={loading} block>
            {mode === 'login' ? '登录系统' : '注册'}
          </Button>
        </Form>
        <Divider />
        <Button type="link" block onClick={() => navigate(mode === 'login' ? '/register' : '/login')}>
          {mode === 'login' ? '没有账号，去注册' : '已有账号，去登录'}
        </Button>
      </Card>
    </div>
  )
}

function Shell({ user, onLogout }: { user: AnyRecord; onLogout: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sysMode, setSysMode] = useState<string>('demo')
  const visibleMenu = menuItems.filter((item) => user.role === 'admin' || !['/users', '/settings'].includes(item.key))

  useEffect(() => {
    api.get('/system/mode').then((res) => setSysMode(res.data.mode)).catch(() => {})
  }, [])

  return (
    <Layout className="app-shell">
      <Layout.Sider width={246} breakpoint="lg" collapsedWidth={0} className="app-sider">
        <div className="sider-logo">
          <div className="logo-leaf">茶</div>
          <div>
            <strong>山茶智耘</strong>
            <span>Camellia Smart Farming</span>
          </div>
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={visibleMenu} onClick={(item) => navigate(item.key)} />
      </Layout.Sider>
      <Layout>
        <Layout.Header className="app-header">
          <div className="header-left">
            <div className="header-title">油茶全周期智慧监测与管理决策系统</div>
            <div className="header-sub">{dayjs().format('YYYY年MM月DD日')} · 天气接口 · 传感器接口</div>
          </div>
          <Space>
            {sysMode === 'demo' ? (
              <Tag color="orange" icon={<ExperimentOutlined />}>演示模式</Tag>
            ) : (
              <Tag color="blue" icon={<SafetyCertificateOutlined />}>生产模式</Tag>
            )}
            <Tag color="green">{roleLabels[user.role] || user.role}</Tag>
            <Typography.Text>{user.username}</Typography.Text>
            <Button icon={<LogoutOutlined />} onClick={onLogout}>
              退出
            </Button>
          </Space>
        </Layout.Header>
        {sysMode === 'demo' && (
          <Alert
            type="warning"
            banner
            showIcon
            message="当前为演示模式，所有数据均为模拟数据。切换至生产模式后将过滤演示数据，请前往「系统设置」切换。"
            closable
          />
        )}
        <Layout.Content className="app-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/plots" element={<Plots />} />
            <Route path="/plots/:id" element={<PlotDetail />} />
            <Route path="/environment" element={<Environment />} />
            <Route path="/warnings" element={<Warnings />} />
            <Route path="/decision" element={<Decision />} />
            <Route path="/growth-records" element={<GrowthRecords />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/diagnosis" element={<Diagnosis />} />
            <Route path="/farming-logs" element={<FarmingLogs />} />
            <Route path="/weather" element={<WeatherPage />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings onModeChange={setSysMode} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}

function Dashboard() {
  const [data, setData] = useState<AnyRecord>()
  useEffect(() => {
    api.get('/dashboard').then((res) => setData(res.data))
  }, [])
  if (!data) return <Card loading />
  if (!data.data_available) {
    return (
      <Space direction="vertical" size={18} className="full">
        <div className="dashboard-hero">
          <div>
            <Typography.Title level={2}>欢迎进入生产模式</Typography.Title>
            <Typography.Text>系统处于生产模式，尚未采集到足够的真实数据。请按照以下步骤开始使用。</Typography.Text>
          </div>
          <Button type="primary" size="large" onClick={() => window.location.href = '/plots'}>开始配置地块</Button>
        </div>
        <Card title="快速入门指南">
          <Steps
            direction="vertical"
            current={0}
            items={[
              { title: '创建油茶地块', description: '在「地块管理」中录入地块基础档案（名称、面积、品种、树龄、土壤类型等）', icon: <HomeOutlined /> },
              { title: '录入环境数据', description: '在「环境监测」中手动录入、批量导入或接入传感器数据', icon: <LineChartOutlined /> },
              { title: '记录田间长势', description: '在「田间巡查」中定期记录新梢长度、叶片状态、病虫害情况', icon: <BarChartOutlined /> },
              { title: '生成预警与决策', description: '数据充分后，系统将自动生成预警信息和农事建议', icon: <ExperimentOutlined /> },
            ]}
          />
          <Divider />
          <Space>
            <Button type="primary" onClick={() => window.location.href = '/plots'}>创建地块</Button>
            <Button onClick={() => window.location.href = '/environment'}>录入环境数据</Button>
            <Button onClick={() => api.put('/system/mode', { mode: 'demo' }).then(() => window.location.reload())}>切换到演示模式体验</Button>
          </Space>
        </Card>
      </Space>
    )
  }
  const cards = data.cards
  const trend = data.environment_trend || []
  const warningTrend = data.warning_trend || []
  const riskEntries = Object.entries(data.risk_levels || {})

  return (
    <Space direction="vertical" size={18} className="full">
      <div className="dashboard-hero">
        <div>
          <Typography.Title level={2}>油茶园实时态势驾驶舱</Typography.Title>
          <Typography.Text>数据采集、风险识别、智能建议、执行记录、效果评估闭环管理</Typography.Text>
        </div>
        <div className="stage-chip">当前综合长势 {cards.growth_score}</div>
      </div>
      <Row gutter={[16, 16]}>
        {[
          ['地块总数', cards.plot_count, '块'],
          ['油茶总面积', cards.total_area, '亩'],
          ['今日监测', cards.today_monitor_count, '条'],
          ['当前预警', cards.current_warning_count, '条'],
          ['严重预警', cards.serious_warning_count, '条'],
          ['今日建议', cards.today_decision_count, '条'],
          ['平均土壤湿度', cards.avg_soil_moisture, '%'],
          ['平均气温', cards.avg_air_temperature, '℃'],
        ].map(([title, value, suffix]) => (
          <Col xs={12} md={6} xl={3} key={title}>
            <Card className="metric-card">
              <Statistic title={title} value={value as number} suffix={suffix} />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={8}>
          <Card title="地块风险排行" className="screen-card">
            <ReactECharts option={barOption(data.risk_rank.map((i: AnyRecord) => i.plot_name), data.risk_rank.map((i: AnyRecord) => i.count), '#D6A84F')} />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="近 7 天环境趋势" className="screen-card">
            <ReactECharts option={lineOption(trend.map((i: AnyRecord) => i.date), [
              { name: '土壤湿度', data: trend.map((i: AnyRecord) => i.soil_moisture) },
              { name: '气温', data: trend.map((i: AnyRecord) => i.air_temperature) },
              { name: '空气湿度', data: trend.map((i: AnyRecord) => i.air_humidity) },
            ])} />
          </Card>
        </Col>
        <Col xs={24} xl={6}>
          <Card title="风险等级分布" className="screen-card">
            <ReactECharts option={pieOption(riskEntries.map(([name, value]) => ({ name, value })))} />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={8}>
          <Card title="长势评分雷达" className="screen-card">
            <ReactECharts option={radarOption(cards)} />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="近 30 天预警趋势" className="screen-card">
            <ReactECharts option={barOption(warningTrend.map((i: AnyRecord) => i.date), warningTrend.map((i: AnyRecord) => i.count), '#E74C3C')} />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="今日待处理任务" className="screen-card">
            <Table size="small" rowKey="id" pagination={false} dataSource={data.tasks} columns={[
              { title: '类型', dataIndex: 'warning_type' },
              { title: '等级', dataIndex: 'warning_level', render: levelTag },
              { title: '状态', dataIndex: 'status' },
            ]} />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

function DataPage({
  title,
  endpoint,
  columns,
  formItems,
  initialValues,
  adminOnly,
}: {
  title: string
  endpoint: string
  columns: ColumnsType<AnyRecord>
  formItems: React.ReactNode
  initialValues?: AnyRecord
  adminOnly?: boolean
}) {
  const [rows, setRows] = useState<AnyRecord[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AnyRecord | null>(null)
  const [form] = Form.useForm()

  const load = useCallback(() => api.get(endpoint).then((res) => setRows(res.data)), [endpoint])
  useEffect(() => {
    load()
  }, [load])

  const save = async (values: AnyRecord) => {
    const payload = normalizeValues(values)
    if (editing) await api.put(`${endpoint}/${editing.id}`, payload)
    else await api.post(endpoint, payload)
    message.success('已保存')
    setOpen(false)
    setEditing(null)
    form.resetFields()
    load()
  }

  const remove = async (id: number) => {
    await api.delete(`${endpoint}/${id}`)
    message.success('已删除')
    load()
  }

  const actionColumn = {
    title: '操作',
    width: 150,
    render: (_: unknown, record: AnyRecord) => (
      <Space>
        <Button size="small" onClick={() => { setEditing(record); form.setFieldsValue(record); setOpen(true) }}>
          编辑
        </Button>
        <Popconfirm title="确认删除？" onConfirm={() => remove(record.id)}>
          <Button danger size="small">
            删除
          </Button>
        </Popconfirm>
      </Space>
    ),
  }

  return (
    <Card
      title={title}
      extra={<Button type="primary" onClick={() => { setEditing(null); form.setFieldsValue(initialValues || {}); setOpen(true) }}>新增</Button>}
    >
      {adminOnly && <Alert type="info" showIcon message="该模块支持管理员维护，普通用户按权限只查看授权数据。" className="mb16" />}
      <Table rowKey="id" scroll={{ x: 1200 }} dataSource={rows} columns={[...columns, actionColumn]} />
      <Drawer title={editing ? `编辑${title}` : `新增${title}`} open={open} width={520} onClose={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={save} initialValues={initialValues}>
          {formItems}
          <Button type="primary" htmlType="submit" block>
            保存
          </Button>
        </Form>
      </Drawer>
    </Card>
  )
}

function Plots() {
  const navigate = useNavigate()
  return (
    <DataPage
      title="油茶园地块管理"
      endpoint="/plots"
      initialValues={{ province: '湖南省', city: '衡阳市', county: '常宁市', management_mode: '智能管理', variety: '普通油茶', soil_type: '红壤' }}
      columns={[
        { title: '编号', dataIndex: 'plot_code', fixed: 'left' },
        { title: '名称', dataIndex: 'plot_name', render: (v, r) => <Button type="link" onClick={() => navigate(`/plots/${r.id}`)}>{v}</Button> },
        { title: '面积(亩)', dataIndex: 'area' },
        { title: '乡镇', dataIndex: 'town' },
        { title: '品种', dataIndex: 'variety' },
        { title: '树龄', dataIndex: 'tree_age' },
        { title: '管理模式', dataIndex: 'management_mode', render: modeTag },
        { title: '灌溉条件', dataIndex: 'irrigation_type', render: irrigationTag },
        { title: '生长阶段', dataIndex: 'current_stage' },
      ]}
      formItems={<PlotForm />}
    />
  )
}

function PlotForm() {
  return (
    <>
      <Form.Item name="plot_name" label="地块名称" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item name="plot_code" label="地块编号" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item name="area" label="种植面积(亩)" rules={[{ required: true }]}><InputNumber className="full" min={0} /></Form.Item>
      <Row gutter={12}><Col span={12}><Form.Item name="town" label="乡镇"><Input /></Form.Item></Col><Col span={12}><Form.Item name="village" label="村"><Input /></Form.Item></Col></Row>
      <Row gutter={12}><Col span={12}><Form.Item name="longitude" label="经度"><InputNumber className="full" /></Form.Item></Col><Col span={12}><Form.Item name="latitude" label="纬度"><InputNumber className="full" /></Form.Item></Col></Row>
      <Row gutter={12}><Col span={12}><Form.Item name="variety" label="油茶品种"><Select options={['普通油茶', '红花油茶', '小果油茶', '湘林210', '长林53'].map(value => ({ value }))} /></Form.Item></Col><Col span={12}><Form.Item name="tree_age" label="树龄"><InputNumber className="full" min={0} /></Form.Item></Col></Row>
      <Row gutter={12}><Col span={12}><Form.Item name="soil_type" label="土壤类型"><Select options={['红壤', '黄壤', '沙壤'].map(value => ({ value }))} /></Form.Item></Col><Col span={12}><Form.Item name="management_mode" label="管理模式"><Select options={['智能管理', '传统管理'].map(value => ({ value }))} /></Form.Item></Col></Row>
      <Row gutter={12}><Col span={12}><Form.Item name="irrigation_type" label="灌溉条件"><Select options={[
        { value: 'drip', label: '滴灌' }, { value: 'sprinkler', label: '喷灌' }, { value: 'manual', label: '人工浇灌' }, { value: 'none', label: '无固定灌溉' }
      ]} /></Form.Item></Col><Col span={12}><Form.Item name="soil_ph" label="土壤pH"><InputNumber className="full" step={0.1} /></Form.Item></Col></Row>
      <Form.Item name="sensor_device_id" label="绑定传感器编号"><Input /></Form.Item>
      <Form.Item name="current_stage" label="当前生长阶段"><Select options={['休眠期', '萌芽抽梢期', '开花坐果期', '果实膨大期', '果实成熟期', '采收恢复期'].map(value => ({ value }))} /></Form.Item>
      <Form.Item name="remark" label="备注"><Input.TextArea rows={3} /></Form.Item>
    </>
  )
}

function PlotDetail() {
  const id = location.pathname.split('/').pop()
  const [plot, setPlot] = useState<AnyRecord>()
  const [env, setEnv] = useState<AnyRecord[]>([])
  const [growth, setGrowth] = useState<AnyRecord[]>([])
  useEffect(() => {
    api.get(`/plots/${id}`).then((res) => setPlot(res.data))
    api.get(`/environment-records?plot_id=${id}`).then((res) => setEnv(res.data))
    api.get(`/growth-records?plot_id=${id}`).then((res) => setGrowth(res.data))
  }, [id])
  if (!plot) return <Card loading />
  const sorted = [...env].reverse().slice(-30)
  return (
    <Space direction="vertical" size={16} className="full">
      <Card title={plot.plot_name}>
        <Descriptions column={{ xs: 1, md: 3 }} bordered>
          <Descriptions.Item label="编号">{plot.plot_code}</Descriptions.Item>
          <Descriptions.Item label="面积">{plot.area} 亩</Descriptions.Item>
          <Descriptions.Item label="位置">{plot.province}{plot.city}{plot.county}{plot.town}{plot.village}</Descriptions.Item>
          <Descriptions.Item label="品种">{plot.variety}</Descriptions.Item>
          <Descriptions.Item label="树龄">{plot.tree_age} 年</Descriptions.Item>
          <Descriptions.Item label="管理模式">{modeTag(plot.management_mode)}</Descriptions.Item>
          <Descriptions.Item label="灌溉条件">{irrigationTag(plot.irrigation_type)}</Descriptions.Item>
          <Descriptions.Item label="土壤pH">{plot.soil_ph || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}><Card title="环境趋势"><ReactECharts option={lineOption(sorted.map(i => dayjs(i.recorded_at).format('MM-DD')), [
          { name: '土壤湿度', data: sorted.map(i => i.soil_moisture) },
          { name: '气温', data: sorted.map(i => i.air_temperature) },
        ])} /></Card></Col>
        <Col xs={24} xl={10}><Card title="田间巡查记录"><Table rowKey="id" size="small" dataSource={growth.slice(0, 8)} columns={[{ title: '时间', dataIndex: 'recorded_at', render: dateText }, { title: '新梢', dataIndex: 'shoot_length' }, { title: '评分', dataIndex: 'growth_score' }, { title: '来源', dataIndex: 'data_source', render: dataSourceTag }]} /></Card></Col>
      </Row>
    </Space>
  )
}

function Environment() {
  const [rows, setRows] = useState<AnyRecord[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AnyRecord | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [form] = Form.useForm()

  const load = () => api.get('/environment-records').then((res) => setRows(res.data))
  useEffect(() => { load() }, [])

  const save = async (values: AnyRecord) => {
    const payload = normalizeValues(values)
    if (editing) await api.put(`/environment-records/${editing.id}`, payload)
    else await api.post('/environment-records', payload)
    message.success('已保存')
    setOpen(false)
    setEditing(null)
    form.resetFields()
    load()
  }

  const remove = async (id: number) => {
    await api.delete(`/environment-records/${id}`)
    message.success('已删除')
    load()
  }

  const handleImport = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post('/environment-records/import-file', formData)
    if (data.errors?.length) {
      message.warning(`导入完成：成功 ${data.imported} 条，${data.errors.length} 条错误`)
    } else {
      message.success(`成功导入 ${data.imported} 条记录`)
    }
    load()
    setImportOpen(false)
    return false
  }

  return (
    <>
      <Card title="环境监测管理" extra={
        <Space>
          <Button icon={<CloudUploadOutlined />} onClick={() => setImportOpen(true)}>批量导入</Button>
          <Button type="primary" onClick={() => { setEditing(null); form.setFieldsValue({ data_source: 'manual', soil_moisture: 55, soil_temperature: 18, air_temperature: 24, air_humidity: 68, light_intensity: 12000, ph_value: 6.1, rainfall: 0, wind_speed: 2 }); setOpen(true) }}>新增</Button>
        </Space>
      }>
        <Table rowKey="id" scroll={{ x: 1400 }} dataSource={rows} columns={[
          { title: '地块ID', dataIndex: 'plot_id' },
          { title: '土壤湿度', dataIndex: 'soil_moisture', render: abnormalMoisture },
          { title: '土壤温度', dataIndex: 'soil_temperature' },
          { title: '气温', dataIndex: 'air_temperature', render: abnormalTemp },
          { title: '空气湿度', dataIndex: 'air_humidity' },
          { title: '光照', dataIndex: 'light_intensity' },
          { title: 'pH', dataIndex: 'ph_value' },
          { title: '来源', dataIndex: 'data_source', render: dataSourceTag },
          { title: '记录时间', dataIndex: 'recorded_at', render: dateText },
          { title: '操作', width: 150, render: (_: unknown, record: AnyRecord) => (
            <Space>
              <Button size="small" onClick={() => { setEditing(record); form.setFieldsValue(record); setOpen(true) }}>编辑</Button>
              <Popconfirm title="确认删除？" onConfirm={() => remove(record.id)}><Button danger size="small">删除</Button></Popconfirm>
            </Space>
          )},
        ]} />
      </Card>
      <Drawer title={editing ? '编辑环境记录' : '新增环境记录'} open={open} width={520} onClose={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="plot_id" label="地块ID" rules={[{ required: true }]}><InputNumber className="full" min={1} /></Form.Item>
          <Row gutter={12}><Col span={12}><Form.Item name="soil_moisture" label="土壤湿度 %"><InputNumber className="full" /></Form.Item></Col><Col span={12}><Form.Item name="soil_temperature" label="土壤温度 ℃"><InputNumber className="full" /></Form.Item></Col></Row>
          <Row gutter={12}><Col span={12}><Form.Item name="air_temperature" label="空气温度 ℃"><InputNumber className="full" /></Form.Item></Col><Col span={12}><Form.Item name="air_humidity" label="空气湿度 %"><InputNumber className="full" /></Form.Item></Col></Row>
          <Row gutter={12}><Col span={12}><Form.Item name="light_intensity" label="光照 lux"><InputNumber className="full" /></Form.Item></Col><Col span={12}><Form.Item name="ph_value" label="土壤 pH"><InputNumber className="full" step={0.1} /></Form.Item></Col></Row>
          <Row gutter={12}><Col span={12}><Form.Item name="rainfall" label="降雨量 mm"><InputNumber className="full" /></Form.Item></Col><Col span={12}><Form.Item name="wind_speed" label="风速 m/s"><InputNumber className="full" /></Form.Item></Col></Row>
          <Form.Item name="data_source" label="数据来源"><Select options={['manual', 'sensor', 'import'].map(value => ({ value, label: dataSourceLabels[value] }))} /></Form.Item>
          <Form.Item name="recorded_at" label="记录时间"><DatePicker showTime className="full" /></Form.Item>
          <Button type="primary" htmlType="submit" block>保存</Button>
        </Form>
      </Drawer>
      <Modal title="批量导入环境数据" open={importOpen} onCancel={() => setImportOpen(false)} footer={null}>
        <Alert type="info" showIcon message="支持 CSV 和 Excel 文件，表头需包含：plot_id, soil_moisture, soil_temperature, air_temperature, air_humidity, light_intensity, ph_value, rainfall, wind_speed" className="mb16" />
        <Upload.Dragger accept=".csv,.xlsx" beforeUpload={handleImport} maxCount={1}>
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p>点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">导入的记录数据来源将标记为"批量导入"</p>
        </Upload.Dragger>
      </Modal>
    </>
  )
}

function Warnings() {
  const [rows, setRows] = useState<AnyRecord[]>([])
  const load = () => api.get('/warnings').then((res) => setRows(res.data))
  useEffect(() => { load() }, [])
  return (
    <Card title="智能预警中心" extra={<Button onClick={() => api.post('/warnings/generate', {}).then(() => { message.success('已生成预警'); load() })}>生成预警</Button>}>
      <Table rowKey="id" scroll={{ x: 1400 }} dataSource={rows} columns={[
        { title: '地块ID', dataIndex: 'plot_id' },
        { title: '类型', dataIndex: 'warning_type' },
        { title: '等级', dataIndex: 'warning_level', render: levelTag },
        { title: '触发条件', dataIndex: 'trigger_condition' },
        { title: '内容', dataIndex: 'warning_content' },
        { title: '建议', dataIndex: 'suggestion' },
        { title: '来源', dataIndex: 'data_source', render: dataSourceTag },
        { title: '状态', dataIndex: 'status', render: statusTag },
        { title: '时间', dataIndex: 'created_at', render: dateText },
        { title: '操作', width: 160, render: (_, r) => <Space><Button size="small" onClick={() => api.put(`/warnings/${r.id}/handle`, {}).then(load)}>处理</Button><Button size="small" onClick={() => api.put(`/warnings/${r.id}/ignore`).then(load)}>忽略</Button></Space> },
      ]} />
    </Card>
  )
}

function Decision() {
  const [plotId, setPlotId] = useState<number>(1)
  const [rows, setRows] = useState<AnyRecord[]>([])
  const [completeness, setCompleteness] = useState<AnyRecord>()
  const [executeModal, setExecuteModal] = useState<AnyRecord | null>(null)
  const [reviewModal, setReviewModal] = useState<AnyRecord | null>(null)
  const [execForm] = Form.useForm()
  const [reviewForm] = Form.useForm()
  const load = () => api.get('/decision-records').then((res) => setRows(res.data))
  useEffect(() => { load() }, [])

  const generateDecisions = async () => {
    const { data } = await api.post(`/decision/generate?plot_id=${plotId}`)
    if (data.data_available === false) {
      message.warning(data.message || '该地块暂无环境数据')
      setCompleteness(data.completeness)
    } else {
      message.success(`已生成 ${data.records?.length || 0} 条建议`)
      setCompleteness(data.completeness)
      load()
    }
  }

  const executeDecision = async (values: AnyRecord) => {
    if (!executeModal) return
    await api.put(`/decision-records/${executeModal.id}/execute`, values)
    message.success('执行反馈已提交')
    setExecuteModal(null)
    execForm.resetFields()
    load()
  }

  const submitReview = async (values: AnyRecord) => {
    if (!reviewModal) return
    await api.post('/expert-reviews', { record_type: 'decision', record_id: reviewModal.id, ...values })
    message.success('审核已提交')
    setReviewModal(null)
    reviewForm.resetFields()
    load()
  }

  const checkCompleteness = async () => {
    const { data } = await api.get(`/data-completeness?plot_id=${plotId}`)
    setCompleteness(data)
  }

  return (
    <Space direction="vertical" className="full" size={16}>
      <Card title="智能农事决策">
        <Space wrap>
          <InputNumber min={1} value={plotId} onChange={(v) => setPlotId(Number(v || 1))} addonBefore="地块ID" />
          <Button type="primary" onClick={generateDecisions}>生成农事建议</Button>
          <Button onClick={checkCompleteness}>检查数据完整性</Button>
        </Space>
      </Card>
      {completeness && !completeness.is_complete && (
        <Alert type="warning" showIcon message="数据完整性提示" description={completeness.recommendation || '建议补充更多数据'} closable />
      )}
      {completeness && completeness.missing_types?.length > 0 && (
        <Card size="small" title="数据缺口">
          {completeness.missing_types.map((t: string) => <Tag color="orange" key={t}>{t}</Tag>)}
          <Typography.Text type="secondary"> 环境近30天：{completeness.environment_records_count}条，巡查近90天：{completeness.growth_records_count}条，农事近90天：{completeness.farming_logs_count}条</Typography.Text>
        </Card>
      )}
      <Card title="决策记录">
        <Table rowKey="id" scroll={{ x: 1600 }} dataSource={rows} columns={[
          { title: '地块ID', dataIndex: 'plot_id' },
          { title: '阶段', dataIndex: 'stage_name' },
          { title: '类型', dataIndex: 'suggestion_type' },
          { title: '建议内容', dataIndex: 'suggestion_content' },
          { title: '风险', dataIndex: 'risk_level', render: levelTag },
          { title: '可信度', dataIndex: 'confidence', render: confidenceTag },
          { title: '来源', dataIndex: 'data_source', render: dataSourceTag },
          { title: '审核', dataIndex: 'review_status', render: (v: string) => <Tag color={reviewStatusColors[v]}>{reviewStatusLabels[v]}</Tag> },
          { title: '执行', dataIndex: 'is_executed', render: (v) => v ? <Tag color="green">已执行</Tag> : <Tag>未执行</Tag> },
          { title: '操作', width: 240, render: (_, r) => (
            <Space>
              <Button size="small" type="primary" onClick={() => { setExecuteModal(r); execForm.setFieldsValue({ execution_status: 'executed', execution_cost: r.execution_cost || 0, feedback: r.feedback || '', execution_image_url: r.execution_image_url }) }}>执行反馈</Button>
              {(userRole() === 'admin' || userRole() === 'expert') && (
                <Button size="small" onClick={() => { setReviewModal(r); reviewForm.setFieldsValue({ review_result: 'approved', review_comment: '' }) }}>审核</Button>
              )}
            </Space>
          )},
        ]} />
      </Card>

      <Modal title="执行反馈" open={!!executeModal} onCancel={() => setExecuteModal(null)} onOk={() => execForm.submit()} destroyOnClose>
        <Form form={execForm} layout="vertical" onFinish={executeDecision}>
          <Form.Item name="execution_status" label="执行状态"><Select options={[
            { value: 'executed', label: '已执行' }, { value: 'partial', label: '部分执行' }, { value: 'not_executed', label: '未执行' }
          ]} /></Form.Item>
          <Form.Item name="execution_cost" label="执行成本（元）"><InputNumber className="full" min={0} /></Form.Item>
          <Form.Item name="execution_image_url" label="现场图片地址"><Input placeholder="可选，上传现场照片链接" /></Form.Item>
          <Form.Item name="feedback" label="执行反馈"><Input.TextArea rows={3} placeholder="描述实际执行情况、效果和问题" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="专家审核" open={!!reviewModal} onCancel={() => setReviewModal(null)} onOk={() => reviewForm.submit()} destroyOnClose>
        <Form form={reviewForm} layout="vertical" onFinish={submitReview}>
          <Form.Item name="review_result" label="审核结果"><Select options={[
            { value: 'approved', label: '批准' }, { value: 'rejected', label: '驳回' }, { value: 'modified', label: '修改建议' }
          ]} /></Form.Item>
          <Form.Item name="review_comment" label="审核意见"><Input.TextArea rows={3} placeholder="审批意见或修改建议" /></Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}

function GrowthRecords() {
  return (
    <DataPage
      title="田间巡查记录"
      endpoint="/growth-records"
      initialValues={{ management_type: '智能管理', tree_age: 5, shoot_length: 15, leaf_color: '深绿', leaf_status: '正常', disease_level: '无', flowering_status: '正常', fruiting_status: '正常', fruit_status: '正常', data_source: 'manual', recorded_at: dayjs() }}
      columns={[
        { title: '地块ID', dataIndex: 'plot_id' },
        { title: '管理类型', dataIndex: 'management_type', render: modeTag },
        { title: '新梢(cm)', dataIndex: 'shoot_length' },
        { title: '叶色', dataIndex: 'leaf_color' },
        { title: '叶片状态', dataIndex: 'leaf_status' },
        { title: '病虫害', dataIndex: 'disease_level' },
        { title: '开花', dataIndex: 'flowering_status' },
        { title: '挂果', dataIndex: 'fruiting_status' },
        { title: '果实', dataIndex: 'fruit_status' },
        { title: '评分', dataIndex: 'growth_score' },
        { title: '来源', dataIndex: 'data_source', render: dataSourceTag },
        { title: '记录时间', dataIndex: 'recorded_at', render: dateText },
      ]}
      formItems={<GrowthForm />}
    />
  )
}

function GrowthForm() {
  const choices: AnyRecord = {
    leaf_color: ['深绿', '浅绿', '发黄', '枯黄'],
    leaf_status: ['正常', '卷曲', '斑点', '脱落'],
    disease_level: ['无', '轻微', '中等', '严重'],
    flowering_status: ['无', '少量', '正常', '较多'],
    fruiting_status: ['无', '少量', '正常', '较多'],
    fruit_status: ['正常', '裂果', '霉变', '脱落'],
  }
  return (
    <>
      <Form.Item name="plot_id" label="地块ID" rules={[{ required: true }]}><InputNumber className="full" min={1} /></Form.Item>
      <Row gutter={12}><Col span={12}><Form.Item name="management_type" label="管理类型"><Select options={['智能管理', '传统管理'].map(value => ({ value }))} /></Form.Item></Col><Col span={12}><Form.Item name="tree_age" label="树龄"><InputNumber className="full" /></Form.Item></Col></Row>
      <Form.Item name="shoot_length" label="新梢长度 cm"><InputNumber className="full" /></Form.Item>
      {Object.entries(choices).map(([name, values]) => <Form.Item name={name} label={name} key={name}><Select options={(values as string[]).map(value => ({ value }))} /></Form.Item>)}
      <Form.Item name="data_source" label="数据来源"><Select options={['manual', 'import', 'sensor'].map(value => ({ value, label: dataSourceLabels[value] }))} /></Form.Item>
      <Form.Item name="image_url" label="图片地址"><Input /></Form.Item>
      <Form.Item name="remark" label="备注"><Input.TextArea rows={3} /></Form.Item>
      <Form.Item name="recorded_at" label="记录时间"><DatePicker showTime className="full" /></Form.Item>
    </>
  )
}

function Comparison() {
  const [data, setData] = useState<AnyRecord>()
  useEffect(() => { api.get('/growth-records/compare').then(res => setData(res.data)) }, [])
  const groups = data?.groups || {}
  const rows: AnyRecord[] = Object.entries(groups).map(([mode, value]) => ({ mode, ...(value as AnyRecord) }))
  return (
    <Space direction="vertical" className="full" size={16}>
      <Alert type="success" showIcon message={data?.conclusion || '正在加载分析结论'} />
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}><Card title="核心指标对比"><ReactECharts option={barOption(rows.map(i => i.mode), rows.map(i => i.avg_growth_score), '#1F6F43')} /></Card></Col>
        <Col xs={24} xl={12}><Card title="健康率对比"><ReactECharts option={barOption(rows.map(i => i.mode), rows.map(i => i.healthy_rate), '#7ABF5A')} /></Card></Col>
      </Row>
      <Card title="成果对比数据表"><Table rowKey="mode" dataSource={rows} columns={[
        { title: '管理模式', dataIndex: 'mode' },
        { title: '记录数', dataIndex: 'count' },
        { title: '平均新梢', dataIndex: 'avg_shoot_length' },
        { title: '平均评分', dataIndex: 'avg_growth_score' },
        { title: '叶片绿色率', dataIndex: 'green_leaf_rate' },
        { title: '健康植株率', dataIndex: 'healthy_rate' },
        { title: '病虫害发生率', dataIndex: 'disease_rate' },
        { title: '挂果率', dataIndex: 'fruiting_rate' },
      ]} /></Card>
    </Space>
  )
}

function Diagnosis() {
  const [form] = Form.useForm()
  const [rows, setRows] = useState<AnyRecord[]>([])
  const [reviewModal, setReviewModal] = useState<AnyRecord | null>(null)
  const [reviewForm] = Form.useForm()
  const load = () => api.get('/diagnosis-records').then(res => setRows(res.data))
  useEffect(() => { load() }, [])
  const submit = (values: AnyRecord) => api.post('/diagnosis', values).then(() => { message.success('诊断完成'); form.resetFields(); load() })

  const submitReview = async (values: AnyRecord) => {
    if (!reviewModal) return
    await api.post('/expert-reviews', { record_type: 'diagnosis', record_id: reviewModal.id, ...values })
    message.success('审核已提交')
    setReviewModal(null)
    reviewForm.resetFields()
    load()
  }

  return (
    <Space direction="vertical" className="full" size={16}>
      <Card title="病虫害图文诊断">
        <Form form={form} layout="inline" onFinish={submit}>
          <Form.Item name="plot_id" rules={[{ required: true }]}><InputNumber placeholder="地块ID" min={1} /></Form.Item>
          <Form.Item name="symptoms" rules={[{ required: true }]}><Select mode="multiple" placeholder="选择症状" style={{ minWidth: 360 }} options={['叶片发黄', '叶片卷曲', '叶片有斑点', '枝条枯萎', '果实裂开', '果实霉变', '叶片虫咬', '树势衰弱', '落花落果'].map(value => ({ value }))} /></Form.Item>
          <Button type="primary" htmlType="submit">开始诊断</Button>
        </Form>
      </Card>
      <Card title="诊断记录">
        <Table rowKey="id" scroll={{ x: 1200 }} dataSource={rows} columns={[
          { title: '地块ID', dataIndex: 'plot_id' },
          { title: '症状', dataIndex: 'symptoms' },
          { title: '可能结果', dataIndex: 'possible_result' },
          { title: '风险', dataIndex: 'risk_level', render: levelTag },
          { title: '建议', dataIndex: 'suggestion' },
          { title: '来源', dataIndex: 'data_source', render: dataSourceTag },
          { title: '专家复核', dataIndex: 'expert_review', render: (v: string) => <Tag color={v === 'approved' ? 'green' : v === 'rejected' ? 'red' : 'default'}>{v}</Tag> },
          { title: '操作', width: 100, render: (_, r) => (userRole() === 'admin' || userRole() === 'expert') ? (
            <Button size="small" onClick={() => { setReviewModal(r); reviewForm.setFieldsValue({ review_result: 'approved', review_comment: '' }) }}>审核</Button>
          ) : null },
        ]} />
      </Card>
      <Modal title="专家审核诊断" open={!!reviewModal} onCancel={() => setReviewModal(null)} onOk={() => reviewForm.submit()} destroyOnClose>
        <Form form={reviewForm} layout="vertical" onFinish={submitReview}>
          <Form.Item name="review_result" label="审核结果"><Select options={[
            { value: 'approved', label: '确认诊断' }, { value: 'rejected', label: '驳回诊断' }, { value: 'modified', label: '修正诊断' }
          ]} /></Form.Item>
          <Form.Item name="review_comment" label="审核意见"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}

function FarmingLogs() {
  return (
    <DataPage
      title="农事日志管理"
      endpoint="/farming-logs"
      initialValues={{ operation_type: '巡园', operation_time: dayjs(), cost: 0, data_source: 'manual' }}
      columns={[
        { title: '地块ID', dataIndex: 'plot_id' },
        { title: '操作类型', dataIndex: 'operation_type' },
        { title: '操作时间', dataIndex: 'operation_time', render: dateText },
        { title: '操作人员', dataIndex: 'operator' },
        { title: '物资', dataIndex: 'materials' },
        { title: '用量', dataIndex: 'dosage' },
        { title: '成本', dataIndex: 'cost' },
        { title: '来源', dataIndex: 'data_source', render: dataSourceTag },
        { title: '关联决策', dataIndex: 'linked_decision_id', render: (v) => v ? <Tag color="blue">#{v}</Tag> : '-' },
        { title: '说明', dataIndex: 'description' },
      ]}
      formItems={<FarmingLogForm />}
    />
  )
}

function FarmingLogForm() {
  return (
    <>
      <Form.Item name="plot_id" label="地块ID" rules={[{ required: true }]}><InputNumber className="full" min={1} /></Form.Item>
      <Form.Item name="operation_type" label="操作类型"><Select options={['灌溉', '施肥', '修剪', '除草', '病虫害防治', '排水', '防冻', '采收', '巡园', '其他'].map(value => ({ value }))} /></Form.Item>
      <Form.Item name="operation_time" label="操作时间"><DatePicker showTime className="full" /></Form.Item>
      <Form.Item name="operator" label="操作人员"><Input /></Form.Item>
      <Row gutter={12}><Col span={12}><Form.Item name="materials" label="使用物资"><Input /></Form.Item></Col><Col span={12}><Form.Item name="dosage" label="用量"><Input /></Form.Item></Col></Row>
      <Form.Item name="cost" label="成本"><InputNumber className="full" min={0} /></Form.Item>
      <Form.Item name="data_source" label="数据来源"><Select options={['manual', 'import'].map(value => ({ value, label: dataSourceLabels[value] }))} /></Form.Item>
      <Form.Item name="description" label="说明"><Input.TextArea rows={3} /></Form.Item>
    </>
  )
}

function WeatherPage() {
  const [rows, setRows] = useState<AnyRecord[]>([])
  const [alerts, setAlerts] = useState<AnyRecord[]>([])
  const [plotId, setPlotId] = useState<number>(1)
  const [syncing, setSyncing] = useState(false)

  const load = () => api.get('/weather-records/latest').then((res) => {
    setRows(Array.isArray(res.data) ? res.data : [])
  })
  useEffect(() => { load() }, [plotId])

  const syncWeather = async () => {
    setSyncing(true)
    try {
      await api.post(`/weather/sync?plot_id=${plotId}`)
    } catch {
      // ok
    } finally {
      setSyncing(false)
    }
    // Always reload records regardless of sync result
    try {
      const res = await api.get(`/weather-records?plot_id=${plotId}`)
      const wdata = res.data || []
      setRows(wdata)
      message.success(`已加载 ${wdata.length} 天天气预报`)
    } catch {
      message.error('天气同步失败，请检查网络')
    }
  }

  const syncAll = async () => {
    setSyncing(true)
    try {
      const { data } = await api.post('/weather/sync')
      message.success(`已同步 ${data.plots} 个地块的天气数据`)
      load()
    } catch {
      message.error('批量同步失败')
    } finally {
      setSyncing(false)
    }
  }

  const checkAlerts = async () => {
    try {
      const { data } = await api.get(`/weather/alerts?plot_id=${plotId}`)
      setAlerts(data.alerts || [])
      if (data.warnings_created > 0) {
        message.warning(`已生成 ${data.warnings_created} 条天气预警`)
      } else {
        message.info('暂无极端天气预警')
      }
    } catch {
      message.error('获取预警失败')
    }
  }

  return (
    <Space direction="vertical" className="full" size={16}>
      <Card title="天气数据" extra={
        <Space>
          <InputNumber min={1} value={plotId} onChange={(v) => setPlotId(Number(v || 1))} addonBefore="地块ID" />
          <Button type="primary" loading={syncing} onClick={syncWeather}>同步天气</Button>
          <Button onClick={syncAll} loading={syncing}>批量同步</Button>
          <Button onClick={checkAlerts}>检查天气预警</Button>
        </Space>
      }>
        <Alert type="success" showIcon message="已接入 Open-Meteo 天气服务，自动获取 7 天天气预报。极端天气（冻害、高温、暴雨）将自动生成预警。" className="mb16" />
        <Table rowKey="id" dataSource={rows} columns={[
          { title: '地块ID', dataIndex: 'plot_id' },
          { title: '预报日期', dataIndex: 'forecast_date' },
          { title: '最高温度', dataIndex: 'temperature_high', render: (v) => v ? <Tag color={v > 35 ? 'red' : 'default'}>{v}℃</Tag> : '-' },
          { title: '最低温度', dataIndex: 'temperature_low', render: (v) => v ? <Tag color={v < 0 ? 'blue' : 'default'}>{v}℃</Tag> : '-' },
          { title: '降雨量', dataIndex: 'rainfall', render: (v) => v && Number(v) > 0 ? `${v}mm` : '-' },
          { title: '降雨概率', dataIndex: 'rainfall_prob', render: (v) => v ? `${v}%` : '-' },
          { title: '天气', dataIndex: 'weather_desc' },
          { title: '来源', dataIndex: 'data_source', render: dataSourceTag },
        ]} />
      </Card>

      {alerts.length > 0 && (
        <Card title={`地块 #${plotId} 天气预警`}>
          {alerts.map((a, i) => (
            <Alert
              key={i}
              type={a.level === '严重' ? 'error' : 'warning'}
              showIcon
              message={<Space><Tag color={a.level === '严重' ? 'red' : 'orange'}>{a.type}</Tag>{a.content}</Space>}
              description={a.suggestion}
              className="mb8"
            />
          ))}
        </Card>
      )}
    </Space>
  )
}

function Reports() {
  const download = (path: string) => window.open(`${API_BASE}${path}`, '_blank')
  return (
    <Card title="数据报表中心">
      <Row gutter={[16, 16]}>
        {['地块环境监测报告', '油茶长势分析报告', '风险预警处理报告', '农事操作记录报告', '智能管理效果对比报告', '月度综合管理报告', '年度油茶园管理报告'].map((title) => (
          <Col xs={24} md={12} xl={8} key={title}>
            <Card className="report-card">
              <Typography.Title level={4}>{title}</Typography.Title>
              <Typography.Text type="secondary">包含基础信息、统计数据、风险分析、农事建议、管理结论和生成时间。生产模式下仅包含真实数据。</Typography.Text>
              <div className="report-actions">
                <Button icon={<FileExcelOutlined />} onClick={() => download('/reports/export/csv')}>CSV</Button>
                <Button icon={<FilePdfOutlined />} type="primary" onClick={() => download('/reports/export/pdf')}>PDF</Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  )
}

function Knowledge() {
  return (
    <DataPage
      title="农事知识库"
      endpoint="/knowledge"
      initialValues={{ category: '灌溉管理', status: 'published' }}
      columns={[
        { title: '标题', dataIndex: 'title' },
        { title: '分类', dataIndex: 'category' },
        { title: '摘要', dataIndex: 'summary' },
        { title: '状态', dataIndex: 'status' },
      ]}
      formItems={<>
        <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="category" label="分类"><Select options={['油茶生长阶段', '灌溉管理', '施肥管理', '修剪管理', '病虫害防治', '防冻防灾', '采收加工', '常见问题'].map(value => ({ value }))} /></Form.Item>
        <Form.Item name="summary" label="摘要"><Input /></Form.Item>
        <Form.Item name="content" label="内容"><Input.TextArea rows={6} /></Form.Item>
      </>}
    />
  )
}

function Users() {
  return (
    <DataPage
      title="用户与权限管理"
      endpoint="/users"
      adminOnly
      initialValues={{ role: 'farmer', status: 'active', password_hash: 'User@123456' }}
      columns={[
        { title: '用户名', dataIndex: 'username' },
        { title: '手机', dataIndex: 'phone' },
        { title: '角色', dataIndex: 'role', render: (v) => roleLabels[v] || v },
        { title: '组织ID', dataIndex: 'organization_id' },
        { title: '状态', dataIndex: 'status', render: statusTag },
      ]}
      formItems={<>
        <Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="password_hash" label="密码 / 重置密码"><Input.Password /></Form.Item>
        <Form.Item name="phone" label="手机号"><Input /></Form.Item>
        <Form.Item name="email" label="邮箱"><Input /></Form.Item>
        <Form.Item name="role" label="角色"><Select options={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))} /></Form.Item>
        <Form.Item name="organization_id" label="组织ID"><InputNumber className="full" /></Form.Item>
        <Form.Item name="status" label="状态"><Select options={['active', 'disabled'].map(value => ({ value }))} /></Form.Item>
      </>}
    />
  )
}

function WechatConfigCard() {
  const [configured, setConfigured] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  useEffect(() => {
    api.get('/notifications/status').then(res => {
      setConfigured(res.data.wecom_configured);
      setQrUrl(res.data.qrcode_url || '');
    }).catch(() => {});
  }, []);
  const sendTest = async () => {
    setTestLoading(true);
    try {
      const { data } = await api.post('/notifications/test');
      if (data.success) {
        message.success('测试消息已发送到企业微信');
      } else {
        message.warning(data.message || '发送失败');
      }
    } catch {
      message.error('发送失败');
    } finally {
      setTestLoading(false);
    }
  };
  return (
    <Card title="微信通知配置（企业微信）">
      <Descriptions column={1} bordered>
        <Descriptions.Item label="配置状态">
          <Space>
            {configured ? <Tag color="green">已配置</Tag> : <Tag color="orange">未配置</Tag>}
            {!configured && <Typography.Text type="secondary">请联系管理员配置企业微信</Typography.Text>}
          </Space>
        </Descriptions.Item>
        {configured && (
          <Descriptions.Item label="手机端操作">
            <Space direction="vertical" style={{ width: '100%', padding: 8 }}>
              <Typography.Text>
                <strong>方法一：</strong>在企业微信 App 或微信中打开「山茶智耘」应用即可接收通知
              </Typography.Text>
              <Typography.Text>
                <strong>方法二：</strong>点击下方按钮，把应用添加到微信
              </Typography.Text>
              <Space>
                <Button type="primary" icon={<WechatOutlined />} loading={testLoading} onClick={sendTest}>
                  发送测试消息
                </Button>
                {qrUrl && <Button onClick={() => window.open(qrUrl, '_blank')}>打开企业微信应用</Button>}
              </Space>
            </Space>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="说明">
          <Typography.Text type="secondary">
            已配置企业微信「山茶智耘」应用，合作社成员加入企业后会自动收到预警通知。
          </Typography.Text>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

function Settings({ onModeChange }: { onModeChange: (m: string) => void }) {
  const [mode, setMode] = useState('demo')
  const [modeLoading, setModeLoading] = useState(false)

  useEffect(() => {
    api.get('/system/mode').then(res => setMode(res.data.mode))
  }, [])

  const toggleMode = async () => {
    setModeLoading(true)
    const newMode = mode === 'demo' ? 'production' : 'demo'
    try {
      await api.put('/system/mode', { mode: newMode })
      setMode(newMode)
      onModeChange(newMode)
      message.success(`已切换至${newMode === 'production' ? '生产模式' : '演示模式'}`)
    } catch {
      message.error('切换失败')
    } finally {
      setModeLoading(false)
    }
  }

  return (
    <Space direction="vertical" className="full" size={16}>
      <Card title="系统运行模式">
        <Descriptions column={1} bordered>
          <Descriptions.Item label="当前模式">
            <Space>
              {mode === 'demo' ? <Tag color="orange" icon={<ExperimentOutlined />}>演示模式</Tag> : <Tag color="blue" icon={<SafetyCertificateOutlined />}>生产模式</Tag>}
              <Typography.Text type="secondary">
                {mode === 'demo' ? '所有数据可见，演示数据参与展示' : '仅真实数据可见，demo 数据被过滤'}
              </Typography.Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="模式切换">
            <Popconfirm
              title={mode === 'demo' ? '确认切换到生产模式？所有演示数据将被隐藏。' : '确认切换到演示模式？演示数据将重新显示。'}
              onConfirm={toggleMode}
            >
              <Button type="primary" loading={modeLoading} danger={mode === 'demo'}>
                切换到{mode === 'demo' ? '生产模式' : '演示模式'}
              </Button>
            </Popconfirm>
          </Descriptions.Item>
        </Descriptions>
        <Divider />
        <Alert
          type={mode === 'demo' ? 'warning' : 'info'}
          showIcon
          message={mode === 'demo' ? '演示模式说明' : '生产模式说明'}
          description={
            mode === 'demo'
              ? '演示模式下系统展示模拟数据用于培训、展会和测试，所有数据标记为"演示数据"标签。演示数据不应用于实际生产决策。'
              : '生产模式下系统仅使用真实录入、导入、传感器和气象数据。数据不足时不生成确定性建议。请确保已经在「地块管理」中创建真实地块并录入数据。'
          }
        />
      </Card>

      <WechatConfigCard />

      <Card title="系统配置">
        <Alert type="info" showIcon message="系统配置可通过 /api/system-config 接口维护。规则库、生长阶段、决策规则等可在对应页面中管理。传感器设备和天气接口在「环境监测」「天气数据」页面中配置。" />
      </Card>

      <DataPage title="生长阶段规则" endpoint="/growth-stages" adminOnly columns={[
        { title: '阶段', dataIndex: 'stage_name' },
        { title: '开始月', dataIndex: 'start_month' },
        { title: '开始日', dataIndex: 'start_day' },
        { title: '结束月', dataIndex: 'end_month' },
        { title: '结束日', dataIndex: 'end_day' },
        { title: '优先级', dataIndex: 'priority' },
        { title: '管理重点', dataIndex: 'management_focus' },
      ]} formItems={<>
        <Form.Item name="stage_name" label="阶段名称"><Input /></Form.Item>
        <Row gutter={12}><Col span={12}><Form.Item name="start_month" label="开始月"><InputNumber className="full" /></Form.Item></Col><Col span={12}><Form.Item name="start_day" label="开始日"><InputNumber className="full" /></Form.Item></Col></Row>
        <Row gutter={12}><Col span={12}><Form.Item name="end_month" label="结束月"><InputNumber className="full" /></Form.Item></Col><Col span={12}><Form.Item name="end_day" label="结束日"><InputNumber className="full" /></Form.Item></Col></Row>
        <Form.Item name="priority" label="优先级"><InputNumber className="full" /></Form.Item>
        <Form.Item name="management_focus" label="管理重点"><Input /></Form.Item>
        <Form.Item name="description" label="说明"><Input.TextArea /></Form.Item>
      </>} />

      <DataPage title="决策规则库" endpoint="/decision-rules" adminOnly columns={[
        { title: '规则名称', dataIndex: 'rule_name' },
        { title: '建议类型', dataIndex: 'suggestion_type' },
        { title: '风险等级', dataIndex: 'risk_level', render: levelTag },
        { title: '版本', dataIndex: 'rule_version' },
        { title: '适用区域', dataIndex: 'applicable_region' },
        { title: '适用品种', dataIndex: 'applicable_variety' },
        { title: '需专家审核', dataIndex: 'requires_expert_review', render: (v: boolean) => v ? <Tag color="orange">是</Tag> : <Tag>否</Tag> },
      ]} formItems={<>
        <Form.Item name="rule_name" label="规则名称"><Input /></Form.Item>
        <Form.Item name="stage_id" label="生长阶段ID"><InputNumber className="full" /></Form.Item>
        <Form.Item name="condition_json" label="触发条件(JSON)"><Input.TextArea rows={3} placeholder='{"soil_moisture": {"lt": 35}}' /></Form.Item>
        <Form.Item name="suggestion_type" label="建议类型"><Select options={['灌溉建议', '施肥建议', '排水建议', '防冻建议', '病虫害防治', '高温防护', '修剪建议', '采收建议', '综合建议'].map(v => ({ value: v }))} /></Form.Item>
        <Form.Item name="suggestion_content" label="建议内容"><Input.TextArea rows={3} /></Form.Item>
        <Row gutter={12}><Col span={8}><Form.Item name="risk_level" label="风险等级"><Select options={['正常', '关注', '警告', '严重'].map(v => ({ value: v }))} /></Form.Item></Col><Col span={8}><Form.Item name="priority" label="优先级"><InputNumber className="full" /></Form.Item></Col><Col span={8}><Form.Item name="rule_version" label="规则版本"><Input /></Form.Item></Col></Row>
        <Row gutter={12}><Col span={12}><Form.Item name="applicable_region" label="适用地区"><Input placeholder="通用/湖南/江西" /></Form.Item></Col><Col span={12}><Form.Item name="applicable_variety" label="适用品种"><Input placeholder="普通油茶/红花油茶" /></Form.Item></Col></Row>
        <Form.Item name="requires_expert_review" label="需要专家审核" valuePropName="checked"><Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} /></Form.Item>
      </>} />

      <DataPage title="传感器设备管理" endpoint="/sensor-devices" adminOnly columns={[
        { title: '设备编号', dataIndex: 'device_code' },
        { title: '地块ID', dataIndex: 'plot_id' },
        { title: '设备类型', dataIndex: 'device_type' },
        { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'online' ? 'green' : 'red'}>{v}</Tag> },
        { title: '最后在线', dataIndex: 'last_online', render: dateText },
      ]} formItems={<>
        <Form.Item name="device_code" label="设备编号"><Input /></Form.Item>
        <Row gutter={12}><Col span={12}><Form.Item name="plot_id" label="地块ID"><InputNumber className="full" /></Form.Item></Col><Col span={12}><Form.Item name="device_type" label="设备类型"><Select options={['soil_moisture', 'temperature', 'humidity', 'light', 'weather'].map(v => ({ value: v, label: v }))} /></Form.Item></Col></Row>
        <Form.Item name="status" label="状态"><Select options={['online', 'offline', 'error'].map(v => ({ value: v }))} /></Form.Item>
      </>} />
    </Space>
  )
}

function normalizeValues(values: AnyRecord) {
  const next = { ...values }
  for (const key of Object.keys(next)) {
    if (dayjs.isDayjs(next[key])) next[key] = next[key].toISOString()
  }
  return next
}

function userRole(): string {
  const raw = localStorage.getItem('user')
  if (!raw) return ''
  return JSON.parse(raw).role || ''
}

function lineOption(labels: string[], series: { name: string; data: number[] }[]) {
  return { tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 36, right: 18, bottom: 28 }, xAxis: { type: 'category', data: labels }, yAxis: { type: 'value' }, series: series.map((s) => ({ ...s, type: 'line', smooth: true, areaStyle: { opacity: 0.08 } })) }
}

function barOption(labels: string[], data: number[], color: string) {
  return { tooltip: {}, grid: { left: 36, right: 18, bottom: 38 }, xAxis: { type: 'category', data: labels, axisLabel: { rotate: labels.length > 8 ? 40 : 0 } }, yAxis: { type: 'value' }, series: [{ type: 'bar', data, itemStyle: { color, borderRadius: [6, 6, 0, 0] } }] }
}

function pieOption(data: AnyRecord[]) {
  return { tooltip: {}, legend: { bottom: 0 }, series: [{ type: 'pie', radius: ['48%', '72%'], data, color: ['#2ECC71', '#3498DB', '#F39C12', '#E74C3C'] }] }
}

function radarOption(cards: AnyRecord) {
  return { radar: { indicator: [{ name: '长势', max: 100 }, { name: '湿度', max: 100 }, { name: '温度适宜', max: 40 }, { name: '低风险', max: 100 }, { name: '执行效率', max: 100 }] }, series: [{ type: 'radar', data: [{ value: [cards.growth_score, cards.avg_soil_moisture, cards.avg_air_temperature, Math.max(0, 100 - cards.current_warning_count * 8), 86], areaStyle: { opacity: 0.2 }, lineStyle: { color: '#1F6F43' } }] }] }
}

function levelTag(level: string) {
  const color: AnyRecord = { 正常: 'green', 关注: 'blue', 警告: 'orange', 严重: 'red' }
  return <Tag color={color[level] || 'default'}>{level}</Tag>
}

function statusTag(status: string) {
  const color: AnyRecord = { active: 'green', disabled: 'red', 未处理: 'red', 处理中: 'orange', 已处理: 'green', 已忽略: 'default' }
  return <Tag color={color[status] || 'default'}>{status}</Tag>
}

function modeTag(mode: string) {
  return <Tag color={mode === '智能管理' ? 'green' : 'gold'}>{mode}</Tag>
}

function dataSourceTag(value: string) {
  if (!value) return <Tag>未知</Tag>
  const color = dataSourceColors[value] || 'default'
  const label = dataSourceLabels[value] || value
  return <Tag color={color}>{label}</Tag>
}

function confidenceTag(value: string) {
  const color = confidenceColors[value] || 'default'
  const label = confidenceLabels[value] || value
  return <Tag color={color}>{label}</Tag>
}

function irrigationTag(value: string) {
  const labels: AnyRecord = { drip: '滴灌', sprinkler: '喷灌', manual: '人工浇灌', none: '无固定灌溉' }
  return <Tag>{labels[value] || value || '-'}</Tag>
}

function dateText(value: string) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

function abnormalMoisture(value: number) {
  return value < 30 || value > 80 ? <Tag color="red">{value}</Tag> : value
}

function abnormalTemp(value: number) {
  return value < 0 || value > 35 ? <Tag color="red">{value}</Tag> : value
}

function App() {
  const auth = useAuth()
  return (
    <AntApp>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" onLogin={auth.login} />} />
          <Route path="/register" element={<AuthPage mode="register" onLogin={auth.login} />} />
          <Route path="/*" element={auth.user ? <Shell user={auth.user} onLogout={auth.logout} /> : <Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AntApp>
  )
}

export default App
