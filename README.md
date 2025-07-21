# AnimeBT - 动漫种子下载站

基于 Nuxt3 + NuxtHub + Cloudflare 构建的动漫BT下载站。

## 功能特性

- 🎯 **用户系统**: 支持注册/登录，多级权限管理（超管/管理员/发布者/普通用户）
- 📁 **种子管理**: 种子上传、审核、分类管理
- 🔍 **搜索功能**: 支持标题和描述搜索
- 📊 **BT Tracker**: 内置tracker，支持客户端过滤
- 🛡️ **安全防护**: 客户端标识过滤、IP过滤
- 📈 **统计分析**: KV存储tracker统计信息
- 💾 **文件存储**: R2存储种子文件，临时访问凭证下载

## 技术栈

- **前端**: Nuxt3 + Vue3 + Nuxt UI + Tailwind CSS
- **后端**: Nuxt3 Server API + H3
- **数据库**: Cloudflare D1 + Drizzle ORM
- **存储**: Cloudflare R2 + KV
- **认证**: Nuxt Auth Utils
- **部署**: Cloudflare Workers + NuxtHub

## 需要配置的Cloudflare功能

### 1. Cloudflare D1 数据库
```bash
# 创建D1数据库
wrangler d1 create animebt-database

# 在wrangler.toml中配置
[[d1_databases]]
binding = "DB"
database_name = "animebt-database"
database_id = "your-database-id"
```

### 2. Cloudflare R2 存储桶
```bash
# 创建R2存储桶
wrangler r2 bucket create animebt-storage

# 在wrangler.toml中配置
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "animebt-storage"
```

### 3. Cloudflare KV 命名空间
```bash
# 创建KV命名空间
wrangler kv:namespace create "ANIMEBT_KV"

# 在wrangler.toml中配置
[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"
```

### 4. Cloudflare Images (可选)
- 用于处理用户头像和种子封面图片
- 需要在Cloudflare Dashboard中启用Images服务

### 5. 环境变量配置
```env
# 复制 .env.example 到 .env 并填写以下信息：

# JWT密钥
NUXT_JWT_SECRET=your-super-secret-jwt-key-here

# Cloudflare配置
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token

# 应用配置
NUXT_PUBLIC_HELLO_TEXT=AnimeBT - 动漫种子下载站
NUXT_PUBLIC_SITE_NAME=AnimeBT
```

## 安装和部署

1. **安装依赖**
```bash
pnpm install
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件填写配置
```

3. **数据库迁移**
```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 执行迁移
pnpm drizzle-kit migrate
```

4. **本地开发**
```bash
pnpm dev
```

5. **部署到Cloudflare**
```bash
pnpm deploy
```

## 项目结构

```
├── app/                    # Nuxt应用目录
│   ├── pages/             # 页面
│   └── assets/            # 静态资源
├── database/              # 数据库相关
│   ├── schema.ts          # 数据库模型
│   └── index.ts           # 数据库连接
├── server/                # 服务端API
│   └── api/               # API路由
│       ├── auth/          # 认证相关
│       ├── torrents/      # 种子管理
│       ├── tracker/       # BT Tracker
│       └── admin/         # 管理功能
└── drizzle.config.ts      # Drizzle配置
```

## API 接口

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出

### 种子管理
- `GET /api/torrents` - 获取种子列表
- `POST /api/torrents/upload` - 上传种子
- `GET /api/torrents/[id]/download` - 下载种子

### BT Tracker
- `GET /api/tracker/announce` - Tracker announce

### 管理功能
- `GET/POST /api/admin/client-filters` - 客户端过滤规则管理

## 权限说明

- **超级管理员**: 所有权限，包括用户管理、过滤规则设置
- **管理员**: 种子审核、用户发布组管理
- **发布者**: 上传种子、管理自己的种子
- **普通用户**: 浏览和下载种子

## 安全特性

1. **客户端过滤**: 支持正则表达式过滤客户端标识
2. **IP过滤**: 支持IP范围和黑名单过滤
3. **权限控制**: 基于角色的访问控制
4. **临时下载**: R2临时访问凭证，防止直链滥用

## 开发计划

- [ ] 用户管理界面
- [ ] 种子发布页面
- [ ] 管理员审核界面
- [ ] 富文本编辑器集成
- [ ] 图片上传功能
- [ ] 搜索优化
- [ ] 移动端适配

## 许可证

MIT License

