import { eq, desc, and, like, or, sql } from 'drizzle-orm'
import { useDrizzle, schema } from '../../database'
import { Logger, AppError, asyncHandler } from '../../utils/logger'
import { ValidationUtils } from '../../utils/validation'
import { PerformanceUtils, QueryOptimizer } from '../../utils/performance'
import type { H3Event } from 'h3'

const logger = Logger.getInstance()

export default defineEventHandler(asyncHandler(async (event: H3Event) => {
  const timer = PerformanceUtils.timer('torrents-list-api')
  
  try {
    const query = getQuery(event)
    const { 
      page: pageStr, 
      limit: limitStr, 
      category, 
      search: searchStr, 
      status = 'approved' 
    } = query

    // 验证分页参数
    const { page, limit, errors: paginationErrors } = ValidationUtils.validatePagination(
      pageStr as string, 
      limitStr as string
    )
    
    // 验证搜索参数
    const { query: search, errors: searchErrors } = ValidationUtils.validateSearchQuery(
      searchStr as string
    )

    const allErrors = [...paginationErrors, ...searchErrors]
    if (allErrors.length > 0) {
      throw new AppError(`参数验证失败: ${allErrors.join(', ')}`, 400)
    }

    // 生成缓存键
    const cacheKey = QueryOptimizer.generateCacheKey('torrents-list', {
      page,
      limit,
      category,
      search,
      status
    })

    logger.info('获取种子列表', {
      page,
      limit,
      category,
      search,
      status,
      cacheKey
    })

    // 使用缓存查询
    const result = await QueryOptimizer.cachedQuery(
      cacheKey,
      async () => {
        const db = useDrizzle()
        
        // 构建查询条件
        const conditions = []
        
        if (status) {
          conditions.push(eq(schema.torrents.status, status as 'pending' | 'approved' | 'rejected'))
        }
        
        if (category) {
          const categoryId = parseInt(category as string)
          if (isNaN(categoryId)) {
            throw new AppError('分类ID必须是数字', 400)
          }
          conditions.push(eq(schema.torrents.categoryId, categoryId))
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

        // 并行执行总数查询和列表查询
        const [totalResult, torrents] = await Promise.all([
          // 获取总数
          db.select({ count: sql`count(*)` })
            .from(schema.torrents)
            .where(whereClause),
          
          // 获取种子列表
          db.select({
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
            .orderBy(desc(schema.torrents.createdAt))
            .limit(limit)
            .offset((page - 1) * limit)
        ])
        
        const total = Number(totalResult[0]?.count || 0)
        
        return {
          success: true,
          data: {
            torrents,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit)
            }
          }
        }
      },
      300000 // 5分钟缓存
    )

    const duration = timer.end()
    
    logger.info('种子列表获取成功', {
      page,
      limit,
      total: result.data.pagination.total,
      duration,
      fromCache: PerformanceUtils.getCache(cacheKey) !== null
    })

    return result

  } catch (error) {
    timer.end()
    
    if (error instanceof AppError) {
      logger.error('种子列表获取失败', error, {
        query: getQuery(event)
      })
      throw error
    }
    
    logger.fatal('种子列表获取时发生未知错误', error as Error, {
      query: getQuery(event)
    })
    
    throw new AppError('获取种子列表失败', 500)
  }
}))