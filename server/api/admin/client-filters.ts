import { eq } from 'drizzle-orm'
import { useDrizzle, schema } from '../../database'

export default defineEventHandler(async (event) => {
  // 检查超管权限
  const session = await getUserSession(event)
  if (!session?.user || session.user.role !== 'super_admin') {
    throw createError({
      statusCode: 403,
      statusMessage: '权限不足，仅超级管理员可以管理过滤规则'
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
        statusMessage: '所有字段都不能为空'
      })
    }

    // 验证正则表达式
    if (type === 'client_regex') {
      try {
        new RegExp(pattern)
      } catch (error) {
        throw createError({
          statusCode: 400,
          statusMessage: '无效的正则表达式'
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
    statusMessage: '方法不允许'
  })
})