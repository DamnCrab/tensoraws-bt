import { eq, desc, count } from 'drizzle-orm'
import { useDrizzle, schema } from '../../../database'
import { validateParams, validateQuery } from '../../../utils/validation'
// import { IdParamsSchema, CommentQuerySchema } from '#shared/schemas'

export default defineEventHandler(async (event) => {
  // 校验路由参数
  const { id: torrentId } = validateParams(event, IdParamsSchema)
  
  // 校验查询参数
  const queryResult = validateQuery(event, CommentQuerySchema)
  const page = queryResult.page ?? 1
  const limit = queryResult.limit ?? 20

  const db = useDrizzle()

  // 检查种子是否存在
  const [torrent] = await db.select()
    .from(schema.torrents)
    .where(eq(schema.torrents.id, torrentId))
    .limit(1)

  if (!torrent) {
    throw createError({
      statusCode: 404,
      message: '种子不存在'
    })
  }

  // 获取评论总数
  const countResult = await db.select({ count: count() })
    .from(schema.comments)
    .where(eq(schema.comments.torrentId, torrentId))

  const total = Number(countResult[0]?.count || 0)

  // 获取评论列表
  const commentsResult = await db.select({
    id: schema.comments.id,
    content: schema.comments.content,
    createdAt: schema.comments.createdAt,
    updatedAt: schema.comments.updatedAt,
    userId: schema.users.id,
    username: schema.users.username,
    avatar: schema.users.avatar,
    role: schema.users.role
  })
    .from(schema.comments)
    .leftJoin(schema.users, eq(schema.comments.userId, schema.users.id))
    .where(eq(schema.comments.torrentId, torrentId))
    .orderBy(desc(schema.comments.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  // 转换数据结构
  const comments = commentsResult.map(row => ({
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    user: row.userId ? {
      id: row.userId,
      username: row.username,
      avatar: row.avatar,
      role: row.role
    } : null
  }))

  return {
    success: true,
    data: comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
})