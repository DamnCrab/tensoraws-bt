import { createHash, randomBytes } from 'crypto'

/**
 * 安全工具类
 */
export class SecurityUtils {
  /**
   * 生成安全的随机字符串
   */
  static generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex')
  }

  /**
   * 创建哈希值
   */
  static createHash(data: string, algorithm: string = 'sha256'): string {
    return createHash(algorithm).update(data).digest('hex')
  }

  /**
   * 验证输入数据
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // 移除潜在的XSS字符
      .trim()
      .substring(0, 1000) // 限制长度
  }

  /**
   * 验证文件类型
   */
  static isValidFileType(filename: string, allowedTypes: string[]): boolean {
    const ext = filename.split('.').pop()?.toLowerCase()
    return ext ? allowedTypes.includes(ext) : false
  }

  /**
   * IP地址验证
   */
  static isValidIP(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
  }

  /**
   * 密码强度验证
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('密码长度至少8位')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母')
    }
    if (!/\d/.test(password)) {
      errors.push('密码必须包含数字')
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密码必须包含特殊字符')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}