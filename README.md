# 山茶智耘 - 油茶全周期智慧监测与管理决策系统

山茶智耘是一套面向油茶种植户、合作社、农业企业和基层农技站的 Web 系统，覆盖地块管理、环境监测、智能预警、农事决策、长势档案、病虫害诊断、成果对比、农事日志、报表导出和后台管理。

## 技术栈

- 前端：React 19、TypeScript、Ant Design、ECharts、Vite
- 后端：FastAPI、SQLModel、JWT、Passlib、ReportLab
- 数据库：默认 SQLite，配置 `DATABASE_URL` 后可迁移到 PostgreSQL/MySQL 兼容部署
- 部署：Docker Compose、Nginx 反向代理

## 默认账号

- 管理员：`admin`
- 密码：`Admin@123456`
- 普通测试用户：`user1` 到 `user9`
- 密码：`User@123456`

## 本地运行

复制环境变量示例文件，并按需修改 `SECRET_KEY`、接口 Key、企业微信等配置：

```bash
copy .env.example .env
```

后端：

```bash
cd backend
python -m pip install -r requirements.txt
python init_db.py
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

前端：

```bash
cd frontend
npm install
npm run dev
```

如果本机 8000 端口被占用，可以用 `--port 8001` 启动后端，并在前端设置：

```bash
set VITE_API_BASE_URL=http://localhost:8001/api
npm run dev
```

## Docker 部署

可选：复制配置文件并修改密钥、数据库等生产配置：

```bash
copy .env.example .env
```

启动。即使不创建 `.env`，下面命令也会使用 Docker Compose 内置默认值启动：

```bash
docker-compose up -d
```

访问：

- 前端：`http://localhost:8080`
- 后端 API：`http://localhost:8000`
- 接口文档：将 `.env` 中 `DEBUG=true` 后可访问 `http://localhost:8000/docs`

## 已实现模块

- 登录注册、JWT 鉴权、角色菜单控制
- 首页数据驾驶舱：核心指标、环境趋势、预警趋势、风险排行、任务列表
- 地块管理：地块增删改查、详情页、环境与长势数据关联
- 环境监测：手动录入、列表、趋势、异常高亮、导入接口预留
- 智能预警：干旱、积水、冻害、高温、病害、pH、光照等规则判断
- 智能农事决策：阶段识别、规则匹配、建议生成、执行反馈
- 生长阶段：可配置阶段时间、优先级和管理重点
- 长势记录：图片字段、评分算法、历史档案
- 病虫害诊断：症状规则判断、知识库、专家复核状态
- 成果对比：智能管理与传统管理分组统计和自动结论
- 农事日志：操作、物资、用量、成本和说明
- 报表中心：CSV/Excel 兼容导出、PDF 报告生成
- 用户与权限管理、系统设置、传感器与 AI 接口预留

## 测试数据

首次启动会自动生成：

- 3 个组织
- 10 个用户
- 20 个油茶地块
- 300 条环境监测数据
- 100 条长势记录
- 预警、农事日志、智能决策、病虫害知识库和知识文章示例数据

## 生产配置

敏感配置放在 `.env` 中，不要提交真实密钥：

- `DATABASE_URL`
- `SECRET_KEY`
- `UPLOAD_DIR`
- `CORS_ORIGINS`
- `VITE_API_BASE_URL`
- `DEEPSEEK_API_KEY`
- `SERVERCHAN_KEY`
- `WXPUSHER_APP_TOKEN`
- `WECOM_CORP_ID`
- `WECOM_AGENT_SECRET`
- `WECOM_AGENT_ID`
- `WECOM_TOKEN`
- `PUBLIC_SITE_URL`

生产环境建议：

- 使用 PostgreSQL 或 MySQL
- 配置 HTTPS 和正式域名
- 修改默认管理员密码
- 设置强随机 `SECRET_KEY`
- 将上传目录挂载为持久化存储
- 通过 Nginx 统一代理 `/api` 和 `/uploads`

## 项目结构

```text
backend/              FastAPI 后端
backend/app/models.py 数据表模型
backend/app/routers/  认证、CRUD、业务接口
backend/app/seed.py   初始化测试数据
frontend/             React 前端
deploy/nginx.conf     Nginx 示例配置
docker-compose.yml    一键部署配置
API.md                接口摘要
```

## 版权说明

本项目仅用于学习、课程设计、作品展示或个人研究用途。
