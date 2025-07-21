import { eq, desc, like, and, or, count, sql } from 'drizzle-orm'
import { useDrizzle, schema } from '../../database'
import { validateQuery } from '../../utils/validation'
// import { TorrentSearchParamsSchema } from '#shared/schemas'

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