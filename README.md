# 山茶智耘 - 油茶全周期智慧监测与管理决策系统

山茶智耘系统是一套面向山茶、油茶种植管理场景的智慧农业 Web 系统，适用于课程设计、毕业设计、作品展示、农业信息化原型验证和个人学习研究。系统围绕油茶园区的日常管理流程，提供地块档案、环境监测、长势记录、智能预警、农事决策、病虫害诊断、数据报表和后台管理等功能。

项目采用前后端分离架构：前端负责页面展示、数据录入和可视化图表，后端负责接口服务、数据模型、权限认证、规则判断和报表生成。默认使用 SQLite 数据库，下载后可以直接初始化本地演示数据，适合快速运行和二次开发。

## 功能概览

- 用户登录注册：支持账号登录、JWT 鉴权和不同角色菜单展示。
- 数据驾驶舱：展示地块数量、监测数据、预警数量、风险排行、环境趋势和待处理任务。
- 地块管理：维护油茶地块基础档案，包括面积、品种、树龄、土壤、灌溉方式等信息。
- 环境监测：记录土壤湿度、土壤温度、空气温度、空气湿度、光照、pH、降雨和风速等数据。
- 智能预警：根据环境数据生成干旱、积水、冻害、高温、病害、pH、光照等风险提示。
- 农事决策：结合生长阶段和规则库生成灌溉、施肥、排水、防冻、病虫害防治等建议。
- 长势记录：记录油茶新梢、叶片、花果、病虫害等巡查信息，并生成长势评分。
- 病虫害诊断：根据症状信息给出可能结果、风险等级和处理建议。
- 成果对比：对智能管理和传统管理数据进行分组统计和效果分析。
- 农事日志：记录农事操作、物资用量、成本、执行说明和图片字段。
- 报表中心：支持 CSV/Excel 兼容导出和 PDF 报告生成。
- 后台管理：包含用户管理、系统模式切换、规则配置、传感器设备和通知配置入口。

## 技术栈

- 前端：React 19、TypeScript、Vite、Ant Design、ECharts、Axios、React Router
- 后端：Python、FastAPI、SQLModel、Pydantic Settings、JWT、Passlib、ReportLab
- 数据库：默认 SQLite，可通过 `DATABASE_URL` 切换到其他 SQL 数据库
- 部署：Docker Compose、Nginx 反向代理

## 项目结构

```text
camellia-smart-farming-system/
├─ backend/                  # FastAPI 后端服务
│  ├─ app/
│  │  ├─ routers/            # 认证、通用 CRUD、业务接口、企业微信回调
│  │  ├─ models.py           # 数据表模型
│  │  ├─ schemas.py          # 请求和响应数据结构
│  │  ├─ database.py         # 数据库连接和迁移兼容逻辑
│  │  ├─ seed.py             # 初始化演示数据
│  │  ├─ algorithms.py       # 预警、长势评分、阶段识别和决策规则
│  │  └─ main.py             # FastAPI 应用入口
│  ├─ init_db.py             # 初始化数据库脚本
│  ├─ requirements.txt       # Python 依赖
│  └─ schema.sql             # 数据库结构参考
├─ frontend/                 # React 前端项目
│  ├─ src/
│  │  ├─ App.tsx             # 主要页面、路由和业务界面
│  │  ├─ App.css             # 页面样式
│  │  └─ main.tsx            # 前端入口
│  ├─ package.json           # 前端依赖和脚本
│  └─ vite.config.ts         # Vite 配置和本地代理
├─ deploy/
│  └─ nginx.conf             # Nginx 反向代理配置
├─ docker-compose.yml        # Docker Compose 部署配置
├─ .env.example              # 环境变量示例
├─ API.md                    # 接口摘要
└─ README.md                 # 项目说明
```

## 环境要求

本地运行前建议先安装：

- Git
- Python 3.10 或更高版本
- Node.js 20 或更高版本
- npm

如果使用 Docker 部署，还需要：

- Docker
- Docker Compose

## 下载项目

```bash
git clone https://github.com/qinzishuo188-boop/camellia-smart-farming-system.git
cd camellia-smart-farming-system
```

如果不熟悉命令行，也可以在 GitHub 页面点击 `Code`，选择 `Download ZIP` 下载压缩包，解压后进入项目目录。

## 配置环境变量

项目不会提交真实 `.env` 文件。首次运行前，请从示例文件复制一份：

Windows：

```bash
copy .env.example .env
```

macOS / Linux：

```bash
cp .env.example .env
```

常用配置说明：

```text
DATABASE_URL=sqlite:///./camellia.db
SECRET_KEY=please-change-this-long-random-secret
UPLOAD_DIR=uploads
DEBUG=false
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
SYSTEM_MODE=demo
DEEPSEEK_API_KEY=your-deepseek-api-key
VITE_API_BASE_URL=http://localhost:8000/api
PUBLIC_SITE_URL=http://your-domain.example
```

本地演示时可以先使用默认值。正式部署时必须修改 `SECRET_KEY`，并按实际情况填写接口 Key、域名和通知配置。

## 本地启动

本项目需要同时启动后端和前端。建议打开两个终端窗口。

### 1. 启动后端

进入后端目录：

```bash
cd backend
```

安装 Python 依赖：

```bash
python -m pip install -r requirements.txt
```

初始化数据库：

```bash
python init_db.py
```

启动后端服务：

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

启动成功后，后端地址为：

```text
http://127.0.0.1:8000
```

健康检查地址：

```text
http://127.0.0.1:8000/health
```

如果需要查看接口文档，请在 `.env` 中设置：

```text
DEBUG=true
```

然后重启后端，访问：

```text
http://127.0.0.1:8000/docs
```

### 2. 启动前端

另开一个终端，进入前端目录：

```bash
cd frontend
```

安装前端依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

启动成功后，浏览器访问：

```text
http://localhost:5173
```

前端开发环境会通过 `vite.config.ts` 将 `/api` 和 `/uploads` 代理到本地后端 `http://127.0.0.1:8000`。

## 默认账号

首次初始化数据库后，系统会生成演示数据和测试账号。

管理员账号：

```text
用户名：admin
密码：Admin@123456
```

普通测试账号：

```text
用户名：user1 到 user9
密码：User@123456
```

正式部署后请立即修改默认管理员密码。

## 常用命令

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

前端打包：

```bash
cd frontend
npm run build
```

前端预览打包结果：

```bash
cd frontend
npm run preview
```

## 端口被占用怎么办

如果 `8000` 端口被占用，可以改用其他端口启动后端，例如：

```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

然后启动前端前设置代理目标。

Windows：

```bash
cd frontend
set VITE_PROXY_TARGET=http://127.0.0.1:8001
npm run dev
```

macOS / Linux：

```bash
cd frontend
VITE_PROXY_TARGET=http://127.0.0.1:8001 npm run dev
```

## Docker 部署

复制环境变量：

```bash
copy .env.example .env
```

macOS / Linux 使用：

```bash
cp .env.example .env
```

启动服务：

```bash
docker-compose up -d
```

查看容器状态：

```bash
docker-compose ps
```

停止服务：

```bash
docker-compose down
```

Docker 部署后默认访问：

```text
前端：http://localhost:8080
后端：http://localhost:8000
```

`docker-compose.yml` 会把后端数据和上传目录挂载到 Docker volume 中，避免容器重建后数据丢失。

## 部署到服务器或宝塔

推荐流程：

1. 在服务器安装 Git、Node.js、Python 或 Docker。
2. 拉取项目代码：

   ```bash
   git clone https://github.com/qinzishuo188-boop/camellia-smart-farming-system.git
   ```

3. 复制并修改 `.env`：

   ```bash
   cp .env.example .env
   ```

4. 修改生产配置：

   ```text
   SECRET_KEY=换成强随机密钥
   CORS_ORIGINS=你的前端域名
   PUBLIC_SITE_URL=你的正式访问地址
   DEBUG=false
   ```

5. 选择部署方式：
   - Docker 方式：使用 `docker-compose up -d`。
   - 手动方式：后端用 `uvicorn` 或进程管理工具运行，前端执行 `npm run build` 后由 Nginx 托管 `frontend/dist`。

6. Nginx 需要代理：
   - `/api` 到后端服务
   - `/uploads` 到后端上传目录
   - 其他路径返回前端静态页面

## 数据说明

首次启动后端时，系统会自动创建数据库表并生成演示数据，包括：

- 3 个组织
- 10 个用户
- 20 个油茶地块
- 300 条环境监测数据
- 100 条长势记录
- 预警记录、农事日志、智能决策、病虫害知识库和知识文章示例数据

运行 `python init_db.py` 后即可创建本地演示数据库。

## 常见问题

### 1. 前端页面打不开

请确认前端开发服务器已经启动，并访问：

```text
http://localhost:5173
```

如果终端提示端口变化，请以终端显示的地址为准。

### 2. 前端请求接口失败

请确认后端正在运行：

```text
http://127.0.0.1:8000/health
```

如果后端端口不是 `8000`，需要设置 `VITE_PROXY_TARGET` 后再启动前端。

### 3. 登录失败

请先运行：

```bash
cd backend
python init_db.py
```

然后使用默认账号登录：

```text
admin / Admin@123456
```

### 4. Python 依赖安装失败

请确认 Python 版本正常：

```bash
python --version
```

建议使用 Python 3.10 或更高版本。如果网络较慢，可以切换 pip 镜像源后重试。

### 5. npm install 失败

请确认 Node.js 和 npm 已安装：

```bash
node -v
npm -v
```

建议使用 Node.js 20 或更高版本。

## 版权说明

本项目仅用于学习、课程设计、作品展示或个人研究用途。
