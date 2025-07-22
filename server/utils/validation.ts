import { z } from 'zod'
import type { H3Event } from 'h3'

// ==================== H3 校验工具函数 ====================

/**
 * 校验请求体
 */
export async function validateBody<T>(
  event: H3Event,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await readBody(event)
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Validation Error',
        data: {
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }
      })
    }
    throw error
  }
}

/**
 * 校验查询参数
 */
export function validateQuery<T>(
  event: H3Event,
  schema: z.ZodSchema<T>
): T {
  try {
    const query = getQuery(event)
    return schema.parse(query)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Query Validation Error',
        data: {
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }
      })
    }
    throw error
  }
}

/**
 * 校验路由参数
 */
export function validateParams<T>(
  event: H3Event,
  schema: z.ZodSchema<T>
): T {
  try {
    const params = getRouterParams(event)
    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Params Validation Error',
        data: {
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }
      })
    }
    throw error
  }
}

// ==================== 原有验证工具 ====================

/**
 * 数据验证工具
 */
export class ValidationUtils {
  /**
   * 验证邮箱格式
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * 验证用户名格式
   */
  static isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    return usernameRegex.test(username)
  }

  /**
   * 验证种子文件哈希
   */
  static isValidTorrentHash(hash: string): boolean {
    const hashRegex = /^[a-fA-F0-9]{40}$/
    return hashRegex.test(hash)
  }

  /**
   * 验证文件大小
   */
  static isValidFileSize(size: number, maxSizeBytes: number): boolean {
    return size > 0 && size <= maxSizeBytes
  }

  /**
   * 验证分页参数
   */
  static validatePagination(page?: string, limit?: string): {
    page: number
    limit: number
    errors: string[]
  } {
    const errors: string[] = []
    let validPage = 1
    let validLimit = 20

    if (page) {
      const pageNum = parseInt(page)
      if (isNaN(pageNum) || pageNum < 1) {
        errors.push('页码必须是大于0的整数')
      } else if (pageNum > 1000) {
        errors.push('页码不能超过1000')
      } else {
        validPage = pageNum
      }
    }

    if (limit) {
      const limitNum = parseInt(limit)
      if (isNaN(limitNum) || limitNum < 1) {
        errors.push('每页数量必须是大于0的整数')
      } else if (limitNum > 100) {
        errors.push('每页数量不能超过100')
      } else {
        validLimit = limitNum
      }
    }

    return { page: validPage, limit: validLimit, errors }
  }

  /**
   * 验证搜索关键词
   */
  static validateSearchQuery(query?: string): {
    query: string
    errors: string[]
  } {
    const errors: string[] = []
    let validQuery = ''

    if (query) {
      const trimmed = query.trim()
      if (trimmed.length < 2) {
        errors.push('搜索关键词至少需要2个字符')
      } else if (trimmed.length > 100) {
        errors.push('搜索关键词不能超过100个字符')
      } else {
        validQuery = trimmed
      }
    }

    return { query: validQuery, errors }
  }
}

/**
 * API 测试工具
 */
export class ApiTestUtils {
  /**
   * 模拟请求事件
   */
  static createMockEvent(options: {
    method?: string
    url?: string
    query?: Record<string, string>
    body?: any
    headers?: Record<string, string>
  } = {}) {
    return {
      node: {
        req: {
          method: options.method || 'GET',
          url: options.url || '/',
          headers: options.headers || {}
        }
      },
      context: {
        query: options.query || {},
        body: options.body
      }
    }
  }

  /**
   * 验证 API 响应格式
   */
  static validateApiResponse(response: any): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (typeof response !== 'object' || response === null) {
      errors.push('响应必须是对象')
      return { isValid: false, errors }
    }

    if (typeof response.success !== 'boolean') {
      errors.push('响应必须包含 success 字段（布尔值）')
    }

    if (response.success && !response.data) {
      errors.push('成功响应必须包含 data 字段')
    }

    if (!response.success && !response.error) {
      errors.push('失败响应必须包含 error 字段')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 性能测试
   */
  static async performanceTest(
    testName: string,
    testFn: () => Promise<any>,
    iterations: number = 10
  ): Promise<{
    testName: string
    iterations: number
    totalTime: number
    averageTime: number
    minTime: number
    maxTime: number
  }> {
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await testFn()
      const end = performance.now()
      times.push(end - start)
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0)
    const averageTime = totalTime / iterations
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)

    return {
      testName,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime
    }
  }
}