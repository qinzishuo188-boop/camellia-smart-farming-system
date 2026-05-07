# 山茶智耘 API 文档

默认地址：`http://localhost:8000/api`

认证方式：登录后在请求头加入 `Authorization: Bearer <token>`。

## 认证

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/profile`
- `PUT /auth/password`

## 核心业务

- `GET/POST/PUT/DELETE /plots`
- `GET/POST/DELETE /environment-records`
- `POST /environment-records/import`
- `GET /environment-records/statistics`
- `GET /environment-records/trend`
- `GET /warnings`
- `POST /warnings/generate`
- `PUT /warnings/{id}/handle`
- `PUT /warnings/{id}/ignore`
- `POST /decision/generate?plot_id=1`
- `GET /decision-records`
- `PUT /decision-records/{id}/execute`
- `GET/POST/PUT/DELETE /growth-records`
- `GET /growth-records/compare`
- `GET /pest-disease`
- `POST /diagnosis`
- `GET /diagnosis-records`
- `GET/POST/PUT/DELETE /farming-logs`
- `GET/POST/PUT/DELETE /knowledge`
- `GET/POST/PUT/DELETE /users`

## 报表与文件

- `GET /reports/export/csv`
- `GET /reports/export/excel`
- `GET /reports/export/pdf`
- `GET /reports/monthly`
- `GET /reports/yearly`
- `GET /reports/plot/{id}`
- `POST /files/upload`
- `GET /files/{id}`
- `DELETE /files/{id}`

交互式接口文档：启动后访问 `http://localhost:8000/docs`。
