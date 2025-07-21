# Zod 数据校验使用指南

本项目已集成 Zod 数据校验库，为所有 API 接口提供强类型的数据校验和类型安全。

## 安装的依赖

- `zod`: 数据校验库

## 校验工具位置

所有校验相关的工具和类型定义位于：`server/utils/validation.ts`

## 主要功能

### 1. 校验模式 (Schemas)

#### 用户相关
- `UserSchema`: 用户数据结构
- `LoginRequestSchema`: 登录请求校验
- `RegisterRequestSchema`: 注册请求校验

#### 种子相关
- `TorrentSchema`: 种子数据结构
- `TorrentUploadRequestSchema`: 种子上传请求校验
- `TorrentSearchParamsSchema`: 种子搜索参数校验

#### 评论相关
- `CommentSchema`: 评论数据结构
- `CommentCreateRequestSchema`: 创建评论请求校验

#### 管理员相关
- `AdminUserUpdateSchema`: 管理员更新用户校验
- `AdminTorrentUpdateSchema`: 管理员更新种子校验

#### 通用
- `ApiResponseSchema`: API 响应格式校验
- `PaginatedResponseSchema`: 分页响应格式校验
- `IdParamsSchema`: ID 参数校验

### 2. 校验工具函数

#### `validateBody<T>(event, schema)`
校验请求体数据
```typescript
const { username, password } = await validateBody(event, LoginRequestSchema)
```

#### `validateQuery<T>(event, schema)`
校验查询参数
```typescript
const { page, limit, q } = validateQuery(event, TorrentSearchParamsSchema)
```

#### `validateParams<T>(event, schema)`
校验路由参数
```typescript
const { id } = validateParams(event, IdParamsSchema)
```

## 使用示例

### 1. 登录接口 (`server/api/auth/login.post.ts`)

```typescript
import { validateBody, LoginRequestSchema } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  // 使用 Zod 校验请求体，自动验证用户名和密码格式
  const { username, password } = await validateBody(event, LoginRequestSchema)
  
  // 业务逻辑...
})
```

### 2. 种子列表接口 (`server/api/torrents/index.get.ts`)

```typescript
import { validateQuery, TorrentSearchParamsSchema } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  // 校验查询参数，自动处理分页、排序等参数
  const { page, limit, category, q: search, sort } = validateQuery(event, TorrentSearchParamsSchema)
  
  // 业务逻辑...
})
```

### 3. 种子上传接口 (`server/api/torrents/upload.post.ts`)

```typescript
import { z } from 'zod'

// 自定义表单数据校验
const TorrentUploadFormSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  description: z.string().optional(),
  categoryId: z.string().transform(val => parseInt(val)).pipe(z.number().positive('分类ID必须是正整数')),
  publishGroupId: z.string().transform(val => parseInt(val)).pipe(z.number().positive()).optional()
})

export default defineEventHandler(async (event) => {
  // 校验表单数据
  const validatedData = TorrentUploadFormSchema.parse(formFields)
  
  // 业务逻辑...
})
```

### 4. 评论接口 (`server/api/torrents/[id]/comments.post.ts`)

```typescript
import { validateBody, validateParams, CommentCreateRequestSchema, IdParamsSchema } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  // 校验路由参数
  const { id: torrentId } = validateParams(event, IdParamsSchema)
  
  // 校验请求体
  const { content } = await validateBody(event, CommentCreateRequestSchema.omit({ torrentId: true }))
  
  // 业务逻辑...
})
```

## 错误处理

当校验失败时，会自动抛出格式化的错误响应：

```json
{
  "statusCode": 400,
  "statusMessage": "Validation Error",
  "data": {
    "errors": [
      {
        "field": "username",
        "message": "String must contain at least 3 character(s)"
      },
      {
        "field": "email",
        "message": "Invalid email"
      }
    ]
  }
}
```

## 类型安全

所有校验模式都导出了对应的 TypeScript 类型：

```typescript
export type User = z.infer<typeof UserSchema>
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type TorrentSearchParams = z.infer<typeof TorrentSearchParamsSchema>
// ... 更多类型
```

## 最佳实践

1. **始终使用校验**: 所有接口都应该使用 Zod 校验输入数据
2. **自定义错误消息**: 为用户提供友好的错误提示
3. **类型复用**: 使用导出的类型确保前后端类型一致
4. **组合校验**: 使用 Zod 的 `omit`、`pick`、`extend` 等方法组合现有校验
5. **转换数据**: 使用 `transform` 方法自动转换数据类型

## 已更新的接口

以下接口已经集成了 Zod 校验：

- ✅ `POST /api/auth/login` - 登录
- ✅ `POST /api/auth/register` - 注册  
- ✅ `GET /api/torrents` - 种子列表
- ✅ `POST /api/torrents/upload` - 种子上传
- ✅ `POST /api/torrents/[id]/comments` - 创建评论
- ✅ `GET /api/torrents/[id]/comments` - 获取评论列表
- ✅ `PATCH /api/admin/torrents/[id]` - 管理员更新种子

## 下一步

建议继续为以下接口添加 Zod 校验：

- 用户资料更新
- 分类管理
- 文件下载
- Tracker 相关接口
- 其他管理员接口