import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind CSS 类名合并工具
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// 格式化日期
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化相对时间
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(months / 12)
  
  if (years > 0) return `${years}年前`
  if (months > 0) return `${months}个月前`
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

// 格式化持续时间
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// 截断文本
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// 验证邮箱
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 验证用户名
export function isValidUsername(username: string): boolean {
  // 用户名只能包含字母、数字、下划线，长度3-20
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

// 验证密码强度
export function isValidPassword(password: string): boolean {
  // 密码至少8位，包含字母和数字
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
  return passwordRegex.test(password)
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 生成随机字符串
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 解析 info hash
export function parseInfoHash(infoHash: string): string {
  // 确保 info hash 是40位十六进制字符串
  const cleanHash = infoHash.replace(/[^a-fA-F0-9]/g, '')
  if (cleanHash.length !== 40) {
    throw new Error('Invalid info hash format')
  }
  return cleanHash.toLowerCase()
}

// 计算下载进度
export function calculateProgress(downloaded: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, Math.max(0, (downloaded / total) * 100))
}

// 获取用户角色显示名称
export function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    'admin': '管理员',
    'moderator': '版主',
    'vip': 'VIP用户',
    'user': '普通用户',
    'banned': '已封禁'
  }
  return roleMap[role] || role
}

// 获取种子状态显示名称
export function getStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': '待审核',
    'approved': '已通过',
    'rejected': '已拒绝',
    'deleted': '已删除'
  }
  return statusMap[status] || status
}

// 获取用户角色颜色
export function getRoleColor(role: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' {
  const colorMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
    admin: 'primary',
    moderator: 'success',
    vip: 'warning',
    user: 'secondary',
    banned: 'error'
  }
  return colorMap[role] || 'secondary'
}

// 获取状态颜色
export function getStatusColor(status: string): 'success' | 'warning' | 'error' | 'primary' {
  const colorMap: Record<string, 'success' | 'warning' | 'error' | 'primary'> = {
    approved: 'success',
    pending: 'warning',
    rejected: 'error',
    deleted: 'error',
    featured: 'primary'
  }
  return colorMap[status] || 'primary'
}

// 复制文本到剪贴板
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textArea)
    return success
  }
}

// 下载文件
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 根据文件扩展名获取图标
export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  
  const iconMap: Record<string, string> = {
    // 视频文件
    'mp4': 'film',
    'mkv': 'film',
    'avi': 'film',
    'mov': 'film',
    'wmv': 'film',
    'flv': 'film',
    'webm': 'film',
    'm4v': 'film',
    'rmvb': 'film',
    
    // 音频文件
    'mp3': 'musical-note',
    'flac': 'musical-note',
    'wav': 'musical-note',
    'aac': 'musical-note',
    'ogg': 'musical-note',
    'wma': 'musical-note',
    'm4a': 'musical-note',
    
    // 图片文件
    'jpg': 'photo',
    'jpeg': 'photo',
    'png': 'photo',
    'gif': 'photo',
    'bmp': 'photo',
    'webp': 'photo',
    'svg': 'photo',
    
    // 文档文件
    'pdf': 'document-text',
    'doc': 'document-text',
    'docx': 'document-text',
    'txt': 'document-text',
    'rtf': 'document-text',
    
    // 压缩文件
    'zip': 'archive-box',
    'rar': 'archive-box',
    '7z': 'archive-box',
    'tar': 'archive-box',
    'gz': 'archive-box',
    
    // 可执行文件
    'exe': 'cog',
    'msi': 'cog',
    'dmg': 'cog',
    'pkg': 'cog',
    'deb': 'cog',
    'rpm': 'cog',
  }
  
  return iconMap[ext] || 'document'
}

// 从路径中提取文件名
export function extractFileName(path: string): string {
  return path.split(/[/\\]/).pop() || path
}

// 格式化描述文本（简单的 Markdown 转 HTML）
export function formatDescription(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

// 验证种子文件
export function isValidTorrentFile(file: File): boolean {
  return file.type === 'application/x-bittorrent' || file.name.endsWith('.torrent')
}

// 验证图片文件
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  return validTypes.includes(file.type)
}

// 生成 Tracker URL
export function generateTrackerUrl(baseUrl: string, infoHash: string, peerId: string): string {
  const params = new URLSearchParams({
    info_hash: infoHash,
    peer_id: peerId,
    port: '6881',
    uploaded: '0',
    downloaded: '0',
    left: '0',
    compact: '1',
    event: 'started'
  })
  
  return `${baseUrl}?${params.toString()}`
}