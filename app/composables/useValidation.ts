import { z } from 'zod'

// 定义表单错误类型
interface FormError {
  path: string
  message: string
}

// 导入共享的校验定义
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  UserProfileUpdateSchema,
  TorrentUploadSchema,
  TorrentUpdateSchema,
  CategoryCreateSchema,
  CategoryUpdateSchema,
  CommentCreateSchema,
  CommentUpdateSchema,
  PublishGroupCreateSchema,
  PublishGroupUpdateSchema,
  FormValidator,
  CommonValidators
} from '../../shared/schemas'

/**
 * 表单校验 composable
 */
export const useValidation = () => {
  /**
   * 将 Zod 错误转换为 Nuxt UI 表单错误格式
   */
  const formatZodErrors = (error: z.ZodError): FormError[] => {
    return error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message
    }))
  }

  /**
   * 安全解析数据
   */
  const safeParseData = <T>(schema: z.ZodSchema<T>, data: unknown) => {
    const result = schema.safeParse(data)
    if (result.success) {
      return { success: true, data: result.data, errors: [] }
    } else {
      return { success: false, data: null, errors: formatZodErrors(result.error) }
    }
  }

  /**
   * 创建表单校验器
   */
  const createFormValidator = <T>(schema: z.ZodSchema<T>) => {
    return {
      validateField: (value: unknown, fieldName: string) => 
        FormValidator.validateField(schema, value, fieldName),
      validateForm: (data: unknown) => 
        FormValidator.validateForm(schema, data),
      createFieldValidator: () => 
        FormValidator.createFieldValidator(schema)
    }
  }

  /**
   * 实时字段校验
   */
  const validateField = <T>(
    schema: z.ZodSchema<T>,
    fieldName: string,
    value: unknown
  ): { isValid: boolean; error?: string } => {
    try {
      // 对于对象 schema，尝试校验整个对象，然后检查特定字段的错误
      if (schema instanceof z.ZodObject) {
        const testData = { [fieldName]: value } as any
        schema.parse(testData)
        return { isValid: true }
      } else {
        // 对于非对象 schema，直接校验值
        schema.parse(value)
        return { isValid: true }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => 
          err.path.length === 0 || err.path.includes(fieldName)
        )
        return {
          isValid: false,
          error: fieldError?.message || '校验失败'
        }
      }
      return { isValid: false, error: '校验失败' }
    }
  }

  /**
   * 批量校验表单数据
   */
  const validateForm = <T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): { isValid: boolean; data?: T; errors: FormError[] } => {
    const result = safeParseData(schema, data)
    return {
      isValid: result.success,
      data: result.data || undefined,
      errors: result.errors
    }
  }

  return {
    // 校验函数
    formatZodErrors,
    safeParseData,
    createFormValidator,
    validateField,
    validateForm,
    
    // 校验 schemas
    schemas: {
      login: LoginRequestSchema,
      register: RegisterRequestSchema,
      userProfile: UserProfileUpdateSchema,
      torrentUpload: TorrentUploadSchema,
      torrentUpdate: TorrentUpdateSchema,
      categoryCreate: CategoryCreateSchema,
      categoryUpdate: CategoryUpdateSchema,
      commentCreate: CommentCreateSchema,
      commentUpdate: CommentUpdateSchema,
      publishGroupCreate: PublishGroupCreateSchema,
      publishGroupUpdate: PublishGroupUpdateSchema
    },
    
    // 通用校验器
    validators: CommonValidators
  }
}

/**
 * 表单字段校验 composable
 */
export const useFieldValidation = () => {
  const { validators } = useValidation()

  /**
   * 用户名校验
   */
  const validateUsername = (username: string) => {
    try {
      validators.username.parse(username)
      return { isValid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors[0]?.message || '用户名格式不正确' }
      }
      return { isValid: false, error: '用户名校验失败' }
    }
  }

  /**
   * 邮箱校验
   */
  const validateEmail = (email: string) => {
    try {
      validators.email.parse(email)
      return { isValid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors[0]?.message || '邮箱格式不正确' }
      }
      return { isValid: false, error: '邮箱校验失败' }
    }
  }

  /**
   * 密码校验
   */
  const validatePassword = (password: string) => {
    try {
      validators.password.parse(password)
      return { isValid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors[0]?.message || '密码格式不正确' }
      }
      return { isValid: false, error: '密码校验失败' }
    }
  }

  /**
   * 确认密码校验
   */
  const validateConfirmPassword = (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      return { isValid: false, error: '两次输入的密码不一致' }
    }
    return { isValid: true }
  }

  /**
   * 手机号校验
   */
  const validatePhone = (phone: string) => {
    try {
      validators.phone.parse(phone)
      return { isValid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors[0]?.message || '手机号格式不正确' }
      }
      return { isValid: false, error: '手机号校验失败' }
    }
  }

  /**
   * URL 校验
   */
  const validateUrl = (url: string) => {
    try {
      validators.url.parse(url)
      return { isValid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors[0]?.message || 'URL格式不正确' }
      }
      return { isValid: false, error: 'URL校验失败' }
    }
  }

  /**
   * 文件大小校验
   */
  const validateFileSize = (size: number, maxSize?: number) => {
    try {
      const schema = maxSize ? validators.fileSize(maxSize) : validators.fileSize(10 * 1024 * 1024)
      schema.parse(size)
      return { isValid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors[0]?.message || '文件大小不符合要求' }
      }
      return { isValid: false, error: '文件大小校验失败' }
    }
  }

  return {
    validateUsername,
    validateEmail,
    validatePassword,
    validateConfirmPassword,
    validatePhone,
    validateUrl,
    validateFileSize
  }
}

/**
 * 表单状态管理 composable
 */
export const useFormState = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialData?: Partial<T>
) => {
  const { validateForm, validateField } = useValidation()
  
  const formData = ref<Partial<T>>(initialData || {})
  const errors = ref<FormError[]>([])
  const isValid = ref(false)
  const isSubmitting = ref(false)

  /**
   * 更新字段值
   */
  const updateField = (field: keyof T, value: any) => {
    formData.value[field] = value
    
    // 实时校验单个字段
    const fieldValidation = validateField(schema, field as string, value)
    
    // 更新错误状态
    errors.value = errors.value.filter((err: FormError) => err.path !== field)
    if (!fieldValidation.isValid && fieldValidation.error) {
      errors.value.push({
        path: field as string,
        message: fieldValidation.error
      })
    }
    
    // 更新整体校验状态
    const formValidation = validateForm(schema, formData.value)
    isValid.value = formValidation.isValid
  }

  /**
   * 校验整个表单
   */
  const validate = () => {
    const result = validateForm(schema, formData.value)
    errors.value = result.errors
    isValid.value = result.isValid
    return result
  }

  /**
   * 重置表单
   */
  const reset = () => {
    formData.value = initialData || {}
    errors.value = []
    isValid.value = false
    isSubmitting.value = false
  }

  /**
   * 设置提交状态
   */
  const setSubmitting = (submitting: boolean) => {
    isSubmitting.value = submitting
  }

  return {
    formData,
    errors: readonly(errors),
    isValid: readonly(isValid),
    isSubmitting: readonly(isSubmitting),
    updateField,
    validate,
    reset,
    setSubmitting
  }
}