/**
 * 统一错误处理和日志系统
 */
import type { H3Event } from 'h3'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error
  userId?: number
  ip?: string
  userAgent?: string
}

export class Logger {
  private static instance: Logger
  private logs: LogEntry[] = []
  private maxLogs = 10000

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error
    }

    this.logs.push(entry)
    
    // 保持日志数量在限制内
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // 控制台输出
    this.consoleOutput(entry)
  }

  private consoleOutput(entry: LogEntry): void {
    const timestamp = entry.timestamp
    const levelName = LogLevel[entry.level]
    const prefix = `[${timestamp}] [${levelName}]`

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.context)
        break
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.context)
        break
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.context)
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, entry.context, entry.error)
        break
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context, error)
  }

  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs
    
    if (level !== undefined) {
      filteredLogs = this.logs.filter(log => log.level >= level)
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit)
    }
    
    return filteredLogs
  }
}

/**
 * 应用错误类
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 错误处理中间件
 */
export const errorHandler = (error: Error, event: H3Event) => {
  const logger = Logger.getInstance()
  
  if (error instanceof AppError) {
    logger.error(error.message, error, {
      statusCode: error.statusCode,
      context: error.context,
      url: event.node.req.url,
      method: event.node.req.method
    })

    throw createError({
      statusCode: error.statusCode,
      message: error.message
    })
  } else {
    logger.fatal('Unhandled error', error, {
      url: event.node.req.url,
      method: event.node.req.method
    })

    throw createError({
      statusCode: 500,
      message: '服务器内部错误'
    })
  }
}

/**
 * 异步错误包装器
 */
export const asyncHandler = (fn: (event: H3Event) => Promise<any>) => {
  return async (event: H3Event) => {
    try {
      return await fn(event)
    } catch (error) {
      errorHandler(error as Error, event)
    }
  }
}