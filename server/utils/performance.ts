/**
 * 性能监控和优化工具
 */
export class PerformanceUtils {
  /**
   * 缓存管理器
   */
  static cache = new Map<string, { data: any; expiry: number }>()

  /**
   * 设置缓存
   */
  static setCache(key: string, data: any, ttlMs: number = 300000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    })
  }

  /**
   * 获取缓存
   */
  static getCache<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data as T
  }

  /**
   * 清理过期缓存
   */
  static cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 数据库查询优化 - 批量操作
   */
  static async batchOperation<T, R>(
    items: T[],
    operation: (batch: T[]) => Promise<R[]>,
    batchSize: number = 100
  ): Promise<R[]> {
    const results: R[] = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await operation(batch)
      results.push(...batchResults)
    }
    
    return results
  }

  /**
   * 防抖函数
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  }

  /**
   * 节流函数
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  /**
   * 性能计时器
   */
  static timer(label: string) {
    const start = performance.now()
    return {
      end: () => {
        const duration = performance.now() - start
        console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
        return duration
      }
    }
  }
}

/**
 * 数据库查询优化助手
 */
export class QueryOptimizer {
  /**
   * 生成缓存键
   */
  static generateCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    return `${prefix}:${sortedParams}`
  }

  /**
   * 带缓存的查询包装器
   */
  static async cachedQuery<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttlMs: number = 300000
  ): Promise<T> {
    // 尝试从缓存获取
    const cached = PerformanceUtils.getCache<T>(cacheKey)
    if (cached) {
      return cached
    }

    // 执行查询
    const result = await queryFn()
    
    // 存储到缓存
    PerformanceUtils.setCache(cacheKey, result, ttlMs)
    
    return result
  }
}