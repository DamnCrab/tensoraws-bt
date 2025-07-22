import { eq } from 'drizzle-orm'
import { useDrizzle, schema } from '../../database'
import { createError } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Admin'],
    summary: '管理客户端过滤规则',
    description: '获取或创建客户端过滤规则，仅超级管理员可用',
    responses: {
      200: {
        description: '操作成功',
        content: {
          'application/json': {
            schema: {
              oneOf: [
                {
                  // GET 响应
                  type: 'object',
                  properties: {
                    filters: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' },
                          type: { type: 'string', enum: ['client_regex', 'client_exact'] },
                          pattern: { type: 'string' },
                          action: { type: 'string', enum: ['block', 'allow'] },
                          isActive: { type: 'boolean' },
                          createdAt: { type: 'string', format: 'date-time' },
                          creator: {
                            type: 'object',
                            properties: {
                              id: { type: 'integer' },
                              username: { type: 'string' }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                {
                  // POST 响应
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    filter: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        type: { type: 'string' },
                        pattern: { type: 'string' },
                        action: { type: 'string' },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        createdBy: { type: 'integer' }
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      },
      400: { description: '请求参数错误' },
      403: { description: '权限不足，仅超级管理员可以管理过滤规则' },
      405: { description: '方法不允许' }
    },
    requestBody: {
      description: '创建过滤规则时的请求体（仅 POST 方法）',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'type', 'pattern', 'action'],
            properties: {
              name: { 
                type: 'string',
                description: '规则名称',
                example: '禁止迅雷客户端'
              },
              type: { 
                type: 'string',
                enum: ['client_regex', 'client_exact'],
                description: '匹配类型'
              },
              pattern: { 
                type: 'string',
                description: '匹配模式',
                example: 'Thunder.*'
              },
              action: { 
                type: 'string',
                enum: ['block', 'allow'],
                description: '执行动作'
              }
            }
          }
        }
      }
    },
    security: [{ sessionAuth: [] }]
  }
})

export default defineEventHandler(async (event) => {
  // 检查超管权限
  const session = await getUserSession(event)
  if (!session?.user || session.user.role !== 'super_admin') {
    throw createError({
      statusCode: 403,
      message: '权限不足，仅超级管理员可以管理过滤规则'
    })
  }

  const db = useDrizzle()

  if (event.method === 'GET') {
    // 获取过滤规则列表
    const filters = await db.select({
      id: schema.clientFilters.id,
      name: schema.clientFilters.name,
      type: schema.clientFilters.type,
      pattern: schema.clientFilters.pattern,
      action: schema.clientFilters.action,
      isActive: schema.clientFilters.isActive,
      createdAt: schema.clientFilters.createdAt,
      creator: {
        id: schema.users.id,
        username: schema.users.username
      }
    })
      .from(schema.clientFilters)
      .leftJoin(schema.users, eq(schema.clientFilters.createdBy, schema.users.id))
      .orderBy(schema.clientFilters.createdAt)

    return { filters }
  }

  if (event.method === 'POST') {
    // 创建新的过滤规则
    const { name, type, pattern, action } = await readBody(event)

    if (!name || !type || !pattern || !action) {
      throw createError({
        statusCode: 400,
        message: '所有字段都不能为空'
      })
    }

    // 验证正则表达式
    if (type === 'client_regex') {
      try {
        new RegExp(pattern)
      } catch (error) {
        throw createError({
          statusCode: 400,
          message: '无效的正则表达式'
        })
      }
    }

    const [newFilter] = await db.insert(schema.clientFilters).values({
      name,
      type,
      pattern,
      action,
      createdBy: session.user.id
    }).returning()

    return { success: true, filter: newFilter }
  }

  throw createError({
    statusCode: 405,
    message: '方法不允许'
  })
})