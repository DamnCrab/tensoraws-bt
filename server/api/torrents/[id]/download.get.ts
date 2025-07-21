import { eq, and } from 'drizzle-orm'
import { useDrizzle, schema } from '../../../database'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '种子ID不能为空'
    })
  }

  const db = useDrizzle()
  
  // 获取种子信息
  const [torrent] = await db.select()
    .from(schema.torrents)
    .where(and(
      eq(schema.torrents.id, parseInt(id)),
      eq(schema.torrents.status, 'approved')
    ))
    .limit(1)

  if (!torrent) {
    throw createError({
      statusCode: 404,
      message: '种子不存在或未审核'
    })
  }

  if (!torrent.r2Key) {
    throw createError({
      statusCode: 404,
      message: '种子文件不存在'
    })
  }

  try {
    // 生成临时访问URL (有效期1小时)
    const blob = hubBlob()
    const url = await (blob as any).getSignedUrl(torrent.r2Key, {
      expiresIn: 3600 as const, // 1小时
      action: 'read' as const
    })

    // 更新下载次数
    await db.update(schema.torrents)
      .set({
        downloads: torrent.downloads + 1
      })
      .where(eq(schema.torrents.id, torrent.id))

    return {
      downloadUrl: url,
      filename: `${torrent.title}.torrent`,
      expiresIn: 3600
    }
  } catch (error) {
    console.error('Failed to generate download URL:', error)
    throw createError({
      statusCode: 500,
      message: '生成下载链接失败'
    })
  }
})