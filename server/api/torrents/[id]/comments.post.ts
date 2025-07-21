import { eq } from 'drizzle-orm'
import { useDrizzle, schema } from '../../../database'
import { validateBody, validateParams } from '../../../utils/validation'
import { CommentCreateSchema, IdParamsSchema } from '../../../../shared/schemas'

export default defineEventHandler(async (event) => {
  // 检查用户权限
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: '请先登录'
    })
  }

  // 校验路由参数
  const { id: torrentId } = validateParams(event, IdParamsSchema)
  
  // 校验请求体
  const { content } = await validateBody(event, CommentCreateSchema.omit({ torrentId: true }))

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

  // 创建评论
  const [newComment] = await db.insert(schema.comments).values({
    content,
    userId: Number(session.user.id),
    torrentId
  }).returning()

  if (!newComment) {
    throw createError({
      statusCode: 500,
      message: '评论创建失败'
    })
  }

  // 获取完整的评论信息（包含用户信息）
  const [commentWithUser] = await db.select({
    id: schema.comments.id,
    content: schema.comments.content,
    createdAt: schema.comments.createdAt,
    updatedAt: schema.comments.updatedAt,
    user: {
      id: schema.users.id,
      username: schema.users.username,
      avatar: schema.users.avatar
    }
  })
    .from(schema.comments)
    .leftJoin(schema.users, eq(schema.comments.userId, schema.users.id))
    .where(eq(schema.comments.id, newComment.id))
    .limit(1)

  return {
    success: true,
    data: commentWithUser
  }
})