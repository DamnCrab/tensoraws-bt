import { z } from 'zod'

/**
 * 校验错误格式化工具
 */
export function formatZodError(error: z.ZodError): Array<{ field: string; message: string }> {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }))
}

/**
 * 创建校验错误响应
 */
export function createValidationError(error: z.ZodError, message: string = 'Validation Error') {
  return {
    statusCode: 400,
    message,
    data: {
      errors: formatZodError(error)
    }
  }
}

/**
 * 安全解析 Zod 模式
 */
export function safeParseSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: Array<{ field: string; message: string }>
} {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return {
      success: true,
      data: result.data
    }
  } else {
    return {
      success: false,
      errors: formatZodError(result.error)
    }
  }
}

/**
 * 表单校验工具类
 */
export class FormValidator {
  /**
   * 校验单个字段
   */
  static validateField<T>(
    schema: z.ZodSchema<T>,
    value: unknown,
    fieldName: string
  ): { isValid: boolean; error?: string } {
    try {
      schema.parse(value)
      return { isValid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0]
        return {
          isValid: false,
          error: firstError?.message || `${fieldName} 格式不正确`
        }
      }
      return {
        isValid: false,
        error: `${fieldName} 校验失败`
      }
    }
  }

  /**
   * 校验整个表单
   */
  static validateForm<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): { isValid: boolean; data?: T; errors?: Record<string, string> } {
    const result = safeParseSchema(schema, data)
    
    if (result.success) {
      return {
        isValid: true,
        data: result.data
      }
    } else {
      const errors: Record<string, string> = {}
      result.errors?.forEach(error => {
        errors[error.field] = error.message
      })
      
      return {
        isValid: false,
        errors
      }
    }
  }

  /**
   * 实时校验字段
   */
  static createFieldValidator<T>(schema: z.ZodSchema<T>) {
    return (value: unknown) => {
      try {
        schema.parse(value)
        return null // 无错误
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.errors[0]?.message || '格式不正确'
        }
        return '校验失败'
      }
    }
  }
}

/**
 * 常用校验规则
 */
export const CommonValidators = {
  /**
   * 用户名校验
   */
  username: z.string()
    .min(3, '用户名至少需要3个字符')
    .max(50, '用户名不能超过50个字符')
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名只能包含字母、数字、下划线和中文'),

  /**
   * 邮箱校验
   */
  email: z.string()
    .email('请输入有效的邮箱地址')
    .max(100, '邮箱地址不能超过100个字符'),

  /**
   * 密码校验
   */
  password: z.string()
    .min(6, '密码至少需要6个字符')
    .max(100, '密码不能超过100个字符')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '密码必须包含至少一个字母和一个数字'),

  /**
   * 强密码校验
   */
  strongPassword: z.string()
    .min(8, '密码至少需要8个字符')
    .max(100, '密码不能超过100个字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, '密码必须包含大小写字母、数字和特殊字符'),

  /**
   * 手机号校验
   */
  phone: z.string()
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码'),

  /**
   * URL 校验
   */
  url: z.string()
    .url('请输入有效的网址')
    .max(500, '网址不能超过500个字符'),

  /**
   * 正整数校验
   */
  positiveInteger: z.number()
    .int('必须是整数')
    .positive('必须是正数'),

  /**
   * 非负整数校验
   */
  nonNegativeInteger: z.number()
    .int('必须是整数')
    .min(0, '不能是负数'),

  /**
   * 文件大小校验（字节）
   */
  fileSize: (maxSizeBytes: number) => z.number()
    .positive('文件大小必须大于0')
    .max(maxSizeBytes, `文件大小不能超过 ${Math.round(maxSizeBytes / 1024 / 1024)} MB`),

  /**
   * 标签数组校验
   */
  tags: z.array(z.string().min(1, '标签不能为空').max(50, '标签不能超过50个字符'))
    .max(10, '最多只能添加10个标签'),

  /**
   * 颜色值校验
   */
  color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, '请输入有效的颜色值'),

  /**
   * 日期范围校验
   */
  dateRange: (startDate?: Date, endDate?: Date) => z.date()
    .refine(date => !startDate || date >= startDate, '日期不能早于开始时间')
    .refine(date => !endDate || date <= endDate, '日期不能晚于结束时间')
}