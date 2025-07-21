import { eq } from 'drizzle-orm'
import { useDrizzle, schema } from '../../../database'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  // 检查管理员权限
  const session = await getUserSession(event)
  if (!session?.user || !['admin', 'super_admin'].includes(session.user.role)) {
    throw createError({
      statusCode: 403,
      message: '权限不足'
    })
  }

  // 校验路由参数
  const { id: torrentId } = validateParams(event, IdParamsSchema)
  
  // 校验请求体
  const updateData = await validateBody(event, AdminTorrentUpdateSchema)

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

  // 更新种子信息
  const [updatedTorrent] = await db.update(schema.torrents)
    .set({
      ...updateData,
      updatedAt: new Date()
    })
    .where(eq(schema.torrents.id, torrentId))
    .returning()

  return {
    success: true,
    data: updatedTorrent,
    message: '种子信息更新成功'
  }
})