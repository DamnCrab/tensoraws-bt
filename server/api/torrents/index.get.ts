import { eq, desc, like, and, or, count, sql } from 'drizzle-orm'
import { useDrizzle, schema } from '../../database'
import { validateQuery } from '../../utils/validation'
import { TorrentSearchParamsSchema } from '../../../shared/schemas'

defineRouteMeta({
  openAPI: {
    tags: ['Torrents'],
    summary: '获取种子列表',
    description: '分页获取种子列表，支持搜索、筛选和排序',
    parameters: [
      {
        name: 'page',
        in: 'query',
        description: '页码',
        schema: { type: 'integer', minimum: 1, default: 1 }
      },
      {
        name: 'limit',
        in: 'query',
        description: '每页数量',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
      },
      {
        name: 'category',
        in: 'query',
        description: '分类ID',
        schema: { type: 'string' }
      },
      {
        name: 'userId',
        in: 'query',
        description: '发布者ID',
        schema: { type: 'integer' }
      },
      {
        name: 'q',
        in: 'query',
        description: '搜索关键词',
        schema: { type: 'string' }
      },
      {
        name: 'sort',
        in: 'query',
        description: '排序方式',
        schema: { 
          type: 'string', 
          enum: ['newest', 'oldest', 'seeders', 'size'],
          default: 'newest'
        }
      },
      {
        name: 'status',
        in: 'query',
        description: '种子状态',
        schema: { 
          type: 'string', 
          enum: ['pending', 'approved', 'rejected', 'all'],
          default: 'approved'
        }
      }
    ],
    responses: {
      200: {
        description: '获取成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      infoHash: { type: 'string' },
                      size: { type: 'integer' },
                      fileCount: { type: 'integer' },
                      seeders: { type: 'integer' },
                      leechers: { type: 'integer' },
                      downloads: { type: 'integer' },
                      createdAt: { type: 'string', format: 'date-time' },
                      status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
                      category: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' },
                          color: { type: 'string' }
                        }
                      },
                      publisher: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          username: { type: 'string' }
                        }
                      },
                      publishGroup: {
                        type: 'object',
                        nullable: true,
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' }
                        }
                      }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  // 使用 Zod 校验查询参数
  const { page = 1, limit = 20, category, userId, q: search, sort, status } = validateQuery(event, TorrentSearchParamsSchema)

  const db = useDrizzle()
  
  // 构建查询条件
  const conditions = []
  
  // 根据状态筛选，默认只显示已审核的种子
  if (status && status !== 'all') {
    conditions.push(eq(schema.torrents.status, status))
  } else if (!status || status !== 'all') {
    conditions.push(eq(schema.torrents.status, 'approved'))
  }
  
  if (category) {
    conditions.push(eq(schema.torrents.categoryId, parseInt(category)))
  }
  
  if (userId) {
    conditions.push(eq(schema.torrents.publisherId, userId))
  }
  
  if (search) {
    conditions.push(
      or(
        like(schema.torrents.title, `%${search}%`),
        like(schema.torrents.description, `%${search}%`)
      )
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // 构建排序条件
  let orderBy
  switch (sort) {
    case 'oldest':
      orderBy = schema.torrents.createdAt
      break
    case 'seeders':
      orderBy = desc(schema.torrents.seeders)
      break
    case 'size':
      orderBy = desc(schema.torrents.size)
      break
    case 'newest':
    default:
      orderBy = desc(schema.torrents.createdAt)
      break
  }

  // 获取总数
  const totalResult = await db.select({ count: sql`count(*)` })
    .from(schema.torrents)
    .where(whereClause)
  
  const total = Number(totalResult[0]?.count || 0)

  // 获取种子列表
  const torrents = await db.select({
    id: schema.torrents.id,
    title: schema.torrents.title,
    description: schema.torrents.description,
    infoHash: schema.torrents.infoHash,
    size: schema.torrents.size,
    fileCount: schema.torrents.fileCount,
    seeders: schema.torrents.seeders,
    leechers: schema.torrents.leechers,
    downloads: schema.torrents.downloads,
    createdAt: schema.torrents.createdAt,
    status: schema.torrents.status,
    category: {
      id: schema.categories.id,
      name: schema.categories.name,
      color: schema.categories.color
    },
    publisher: {
      id: schema.users.id,
      username: schema.users.username
    },
    publishGroup: {
      id: schema.publishGroups.id,
      name: schema.publishGroups.name
    }
  })
    .from(schema.torrents)
    .leftJoin(schema.categories, eq(schema.torrents.categoryId, schema.categories.id))
    .leftJoin(schema.users, eq(schema.torrents.publisherId, schema.users.id))
    .leftJoin(schema.publishGroups, eq(schema.torrents.publishGroupId, schema.publishGroups.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset((page - 1) * limit)

  return {
    success: true,
    data: torrents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
})