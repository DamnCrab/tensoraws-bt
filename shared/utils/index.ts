import { z } from 'zod'

// ==================== 通用校验模式 ====================

// 通用响应类型
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional()
})

// 分页响应类型
export const PaginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  }),
  message: z.string().optional()
})

// 通用ID参数校验
export const IdParamsSchema = z.object({
  id: z.coerce.number().positive()
})

// ==================== 用户相关校验 ====================

export const UserSchema = z.object({
  id: z.number(),
  username: z.string().min(3, '用户名至少需要3个字符').max(50, '用户名不能超过50个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string(),
  role: z.enum(['super_admin', 'admin', 'publisher', 'user']),
  avatar: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean()
})

export const LoginRequestSchema = z.object({
  username: z.string().min(3, '用户名至少需要3个字符').max(50, '用户名不能超过50个字符'),
  password: z.string().min(6, '密码至少需要6个字符').max(100, '密码不能超过100个字符')
})

export const RegisterRequestSchema = z.object({
  username: z.string().min(3, '用户名至少需要3个字符').max(50, '用户名不能超过50个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符').max(100, '密码不能超过100个字符'),
  confirmPassword: z.string().min(6, '确认密码至少需要6个字符').max(100, '确认密码不能超过100个字符')
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword']
})

export const UserProfileUpdateSchema = z.object({
  username: z.string().min(3, '用户名至少需要3个字符').max(50, '用户名不能超过50个字符').optional(),
  email: z.string().email('请输入有效的邮箱地址').optional(),
  avatar: z.string().optional(),
  newPassword: z.string().min(6, '新密码至少需要6个字符').max(100, '新密码不能超过100个字符').optional(),
  confirmNewPassword: z.string().optional(),
  currentPassword: z.string().optional()
}).refine((data) => {
  if (data.newPassword && !data.confirmNewPassword) {
    return false
  }
  if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
    return false
  }
  return true
}, {
  message: '两次输入的新密码不一致',
  path: ['confirmNewPassword']
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false
  }
  return true
}, {
  message: '修改密码时需要输入当前密码',
  path: ['currentPassword']
})

// ==================== 分类相关校验 ====================

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string().min(1, '分类名称不能为空').max(100, '分类名称不能超过100个字符'),
  description: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const CategoryCreateSchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(100, '分类名称不能超过100个字符'),
  description: z.string().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true)
})

export const CategoryUpdateSchema = CategoryCreateSchema.partial()

// ==================== 发布组相关校验 ====================

export const PublishGroupSchema = z.object({
  id: z.number(),
  name: z.string().min(1, '发布组名称不能为空').max(100, '发布组名称不能超过100个字符'),
  description: z.string().optional(),
  website: z.string().url('请输入有效的网址').optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const PublishGroupCreateSchema = z.object({
  name: z.string().min(1, '发布组名称不能为空').max(100, '发布组名称不能超过100个字符'),
  description: z.string().optional(),
  website: z.string().url('请输入有效的网址').optional(),
  isActive: z.boolean().default(true)
})

export const PublishGroupUpdateSchema = PublishGroupCreateSchema.partial()

// ==================== 种子相关校验 ====================

export const TorrentSchema = z.object({
  id: z.number(),
  title: z.string().min(1, '种子标题不能为空').max(200, '种子标题不能超过200个字符'),
  description: z.string().optional(),
  categoryId: z.number().positive('请选择分类'),
  publishGroupId: z.number().positive().optional(),
  userId: z.number(),
  infoHash: z.string().length(40),
  size: z.number().positive(),
  seeders: z.number().min(0).default(0),
  leechers: z.number().min(0).default(0),
  downloads: z.number().min(0).default(0),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  tags: z.array(z.string()).optional(),
  coverImage: z.string().optional(),
  isPrivate: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  autoApprove: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const TorrentUploadSchema = z.object({
  title: z.string().min(1, '种子标题不能为空').max(200, '种子标题不能超过200个字符'),
  description: z.string().optional(),
  categoryId: z.number().positive('请选择分类'),
  publishGroupId: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  coverImage: z.string().optional(),
  isPrivate: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  autoApprove: z.boolean().default(false)
})

export const TorrentUpdateSchema = TorrentUploadSchema.partial()

export const TorrentSearchParamsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  publishGroup: z.string().optional(),
  userId: z.coerce.number().positive().optional(),
  tags: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'seeders', 'leechers', 'downloads', 'size', 'title']).default('newest'),
  order: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['all', 'pending', 'approved', 'rejected']).default('approved'),
  minSize: z.coerce.number().positive().optional(),
  maxSize: z.coerce.number().positive().optional(),
  sizeUnit: z.enum(['B', 'KB', 'MB', 'GB', 'TB']).default('GB'),
  timeRange: z.enum(['all', 'today', 'week', 'month', 'year']).default('all'),
  minSeeders: z.coerce.number().min(0).optional(),
  maxSeeders: z.coerce.number().min(0).optional(),
  minLeechers: z.coerce.number().min(0).optional(),
  maxLeechers: z.coerce.number().min(0).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

// ==================== 评论相关校验 ====================

export const CommentSchema = z.object({
  id: z.number(),
  content: z.string().min(1, '评论内容不能为空').max(1000, '评论内容不能超过1000个字符'),
  userId: z.number(),
  torrentId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const CommentCreateSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(1000, '评论内容不能超过1000个字符'),
  torrentId: z.number().positive('种子ID无效')
})

export const CommentUpdateSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(1000, '评论内容不能超过1000个字符')
})

export const CommentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

// ==================== 管理员相关校验 ====================

export const AdminUserUpdateSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'publisher', 'user']).optional(),
  isActive: z.boolean().optional()
})

export const AdminTorrentUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  title: z.string().min(1, '种子标题不能为空').max(200, '种子标题不能超过200个字符').optional(),
  description: z.string().optional(),
  categoryId: z.number().positive('请选择分类').optional()
})

// ==================== 类型导出 ====================

export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & { data?: T }
export type PaginatedResponse<T = any> = z.infer<typeof PaginatedResponseSchema> & { data: T[] }
export type User = z.infer<typeof UserSchema>
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>
export type UserProfileUpdate = z.infer<typeof UserProfileUpdateSchema>
export type Category = z.infer<typeof CategorySchema>
export type CategoryCreate = z.infer<typeof CategoryCreateSchema>
export type CategoryUpdate = z.infer<typeof CategoryUpdateSchema>
export type PublishGroup = z.infer<typeof PublishGroupSchema>
export type PublishGroupCreate = z.infer<typeof PublishGroupCreateSchema>
export type PublishGroupUpdate = z.infer<typeof PublishGroupUpdateSchema>
export type Torrent = z.infer<typeof TorrentSchema>
export type TorrentUpload = z.infer<typeof TorrentUploadSchema>
export type TorrentUpdate = z.infer<typeof TorrentUpdateSchema>
export type TorrentSearchParams = z.infer<typeof TorrentSearchParamsSchema>
export type Comment = z.infer<typeof CommentSchema>
export type CommentCreate = z.infer<typeof CommentCreateSchema>
export type CommentUpdate = z.infer<typeof CommentUpdateSchema>
export type CommentQuery = z.infer<typeof CommentQuerySchema>
export type AdminUserUpdate = z.infer<typeof AdminUserUpdateSchema>
export type AdminTorrentUpdate = z.infer<typeof AdminTorrentUpdateSchema>
export type IdParams = z.infer<typeof IdParamsSchema>

// ==================== 导入并重新导出校验工具 ====================

// export { FormValidator, CommonValidators } from './validators'