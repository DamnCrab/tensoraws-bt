import {eq} from 'drizzle-orm'
import {useDrizzle, schema} from '../../../database'
import {validateBody, validateParams} from '../../../utils/validation'
import { createError } from 'h3'
import { IdParamsSchema, CommentCreateSchema } from '../../../../shared/schemas'

defineRouteMeta({
  openAPI: {
    tags: ['Comments'],
    summary: '发表种子评论',
    description: '为指定种子发表评论，需要登录',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: '种子ID',
        schema: { type: 'integer' }
      }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['content'],
            properties: {
              content: {
                type: 'string',
                minLength: 1,
                maxLength: 1000,
                description: '评论内容',
                example: '这个资源很不错，感谢分享！'
              }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: '评论发表成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    content: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        username: { type: 'string' },
                        avatar: { type: 'string', nullable: true }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      401: { description: '请先登录' },
      404: { description: '种子不存在' },
      500: { description: '评论创建失败' }
    },
    security: [{ sessionAuth: [] }]
  }
})

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
    const {id: torrentId} = validateParams(event, IdParamsSchema)

    // 校验请求体
    const {content} = await validateBody(event, CommentCreateSchema.omit({torrentId: true}))

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