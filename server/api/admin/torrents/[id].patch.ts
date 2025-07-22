import { eq } from 'drizzle-orm'
import { useDrizzle, schema } from '../../../database'
import { createError } from 'h3'
import { validateParams, validateBody } from '../../../utils/validation'
import { IdParamsSchema, AdminTorrentUpdateSchema } from '../../../../shared/schemas'

defineRouteMeta({
  openAPI: {
    tags: ['Admin', 'Torrents'],
    summary: '更新种子信息',
    description: '管理员更新指定种子的信息',
    parameters: [
      {
        in: 'path',
        name: 'id',
        required: true,
        schema: { type: 'integer' },
        description: '种子ID'
      }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: '种子标题' },
              description: { type: 'string', description: '种子描述' },
              categoryId: { type: 'integer', description: '分类ID' },
              publishGroupId: { type: 'integer', description: '发布组ID' },
              status: { 
                type: 'string', 
                enum: ['pending', 'approved', 'rejected'],
                description: '种子状态' 
              }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: '更新成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: { type: 'object', description: '更新后的种子信息' },
                message: { type: 'string' }
              }
            }
          }
        }
      },
      403: { description: '权限不足' },
      404: { description: '种子不存在' }
    },
    security: [{ sessionAuth: [] }]
  }
})

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