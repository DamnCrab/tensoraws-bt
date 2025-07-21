<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center items-center min-h-screen">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-blue-500" />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="flex flex-col items-center justify-center min-h-screen">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 text-red-500 mb-4" />
      <h2 class="text-2xl font-bold text-gray-900 mb-2">加载失败</h2>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <UButton @click="loadTorrent" icon="i-heroicons-arrow-path">重试</UButton>
    </div>

    <!-- 种子详情 -->
    <div v-else-if="torrent" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 返回按钮 -->
      <div class="mb-6">
        <UButton @click="$router.back()" variant="outline" icon="i-heroicons-arrow-left">
          返回
        </UButton>
      </div>

      <!-- 种子基本信息 -->
      <UCard class="mb-8">
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- 封面图片 -->
          <div v-if="torrent.coverImage" class="lg:w-64 flex-shrink-0">
            <img
              :src="torrent.coverImage"
              :alt="torrent.title"
              class="w-full h-auto rounded-lg shadow-md"
            />
          </div>

          <!-- 基本信息 -->
          <div class="flex-1">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ torrent.title }}</h1>
                <div class="flex items-center gap-2 mb-4">
                  <UBadge :color="getStatusColor(torrent.status)" variant="soft">
                    {{ getStatusDisplayName(torrent.status) }}
                  </UBadge>
                  <UBadge v-if="torrent.isPrivate" color="warning" variant="soft">
                    私有种子
                  </UBadge>
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="flex gap-2">
                <UButton
                  @click="downloadTorrent"
                  :disabled="torrent.status !== 'approved'"
                  :loading="downloadLoading"
                  icon="i-heroicons-arrow-down-tray"
                  size="lg"
                >
                  下载种子
                </UButton>
                <UButton
                  v-if="canEdit"
                  @click="editTorrent"
                  variant="outline"
                  icon="i-heroicons-pencil"
                  size="lg"
                >
                  编辑
                </UButton>
              </div>
            </div>

            <!-- 统计信息 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="text-center p-3 bg-green-50 rounded-lg">
                <div class="text-2xl font-bold text-green-600">{{ torrent.seeders }}</div>
                <div class="text-sm text-gray-600">做种者</div>
              </div>
              <div class="text-center p-3 bg-red-50 rounded-lg">
                <div class="text-2xl font-bold text-red-600">{{ torrent.leechers }}</div>
                <div class="text-sm text-gray-600">下载者</div>
              </div>
              <div class="text-center p-3 bg-blue-50 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">{{ torrent.downloads }}</div>
                <div class="text-sm text-gray-600">完成数</div>
              </div>
              <div class="text-center p-3 bg-purple-50 rounded-lg">
                <div class="text-2xl font-bold text-purple-600">{{ formatFileSize(torrent.size) }}</div>
                <div class="text-sm text-gray-600">文件大小</div>
              </div>
            </div>

            <!-- 详细属性 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">发布者:</span>
                <span class="font-medium">{{ torrent.publisher?.username }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">创建时间:</span>
                <span class="font-medium">{{ formatDate(torrent.createdAt) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">文件数量:</span>
                <span class="font-medium">{{ torrent.fileCount }} 个文件</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Info Hash:</span>
                <span class="font-mono text-xs">{{ torrent.infoHash }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">分类:</span>
                <span class="font-medium">{{ torrent.category?.name }}</span>
              </div>
              <div v-if="torrent.publishGroup" class="flex justify-between">
                <span class="text-gray-600">发布组:</span>
                <span class="font-medium">{{ torrent.publishGroup.name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">最后更新:</span>
                <span class="font-medium">{{ torrent.updatedAt ? formatDate(torrent.updatedAt) : '未知' }}</span>
              </div>
              <div v-if="trackerUrl" class="flex justify-between">
                <span class="text-gray-600">Tracker:</span>
                <span class="font-mono text-xs truncate">{{ trackerUrl }}</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- 标签 -->
      <UCard v-if="torrent.tags && torrent.tags.length > 0" class="mb-8">
        <template #header>
          <h3 class="text-lg font-semibold">标签</h3>
        </template>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="tag in torrent.tags"
            :key="tag"
            variant="soft"
            color="primary"
          >
            {{ tag }}
          </UBadge>
        </div>
      </UCard>

      <!-- 描述 -->
      <UCard v-if="torrent.description" class="mb-8">
        <template #header>
          <h3 class="text-lg font-semibold">描述</h3>
        </template>
        <div class="prose max-w-none" v-html="formatDescription(torrent.description)"></div>
      </UCard>

      <!-- 文件列表 -->
      <UCard v-if="files && files.length > 0" class="mb-8">
        <template #header>
          <h3 class="text-lg font-semibold">文件列表 ({{ files.length }} 个文件)</h3>
        </template>
        
        <div v-if="loadingFiles" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin" />
        </div>
        
        <div v-else class="space-y-2">
          <div
            v-for="file in files"
            :key="file.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <UIcon :name="getFileIcon(file.path)" class="w-5 h-5 text-gray-500" />
              <span class="font-medium">{{ file.path }}</span>
            </div>
            <span class="text-sm text-gray-600">{{ formatFileSize(file.size) }}</span>
          </div>
        </div>
      </UCard>

      <!-- 评论区 -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">评论 ({{ comments.length }})</h3>
        </template>

        <!-- 添加评论 -->
        <div v-if="user" class="mb-6">
          <UTextarea
            v-model="newComment"
            placeholder="写下你的评论..."
            :rows="3"
            class="mb-3"
          />
          <div class="flex justify-end">
            <UButton @click="addComment" :loading="commentLoading" :disabled="!newComment.trim()">
              发表评论
            </UButton>
          </div>
        </div>

        <div v-else class="mb-6 p-4 bg-gray-50 rounded-lg text-center">
          <p class="text-gray-600 mb-3">请登录后发表评论</p>
          <UButton @click="showAuth = true">登录</UButton>
        </div>

        <!-- 评论列表 -->
        <div v-if="comments.length > 0" class="space-y-4">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="border-b border-gray-200 pb-4 last:border-b-0"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="font-semibold">{{ comment.user?.username || '匿名用户' }}</span>
                <span class="text-sm text-gray-500">{{ formatDate(comment.createdAt) }}</span>
              </div>
              <UButton
                  v-if="canDeleteComment(comment)"
                  @click="deleteComment(comment.id)"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-trash"
                  color="error"
                />
            </div>
            <p class="text-gray-700">{{ comment.content }}</p>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          暂无评论，快来发表第一条评论吧！
        </div>
      </UCard>
    </div>

    <!-- 认证模态框 -->
    <AuthModal 
      v-model="showAuth" 
      :default-mode="authMode"
      @success="handleAuthSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import type { User, Torrent, Comment, TorrentFile } from '~/types'
import { authApi, torrentApi, commentApi } from '~/utils/api'
import { formatFileSize, formatDate, getStatusColor, getStatusDisplayName } from '~/utils'

// 页面元数据
definePageMeta({
  title: '种子详情',
  layout: 'default'
})

// 路由参数
const route = useRoute()
const torrentId = parseInt(route.params.id as string)

// 响应式数据
const user = ref<User | null>(null)
const torrent = ref<Torrent | null>(null)
const files = ref<TorrentFile[]>([])
const comments = ref<Comment[]>([])
const loading = ref(true)
const loadingFiles = ref(false)
const downloadLoading = ref(false)
const error = ref<string | null>(null)
const commentLoading = ref(false)
const newComment = ref('')
const showAuth = ref(false)
const authMode = ref<'login' | 'register'>('login')

// 计算属性
const canEdit = computed(() => {
  if (!user.value || !torrent.value) return false
  return user.value.id === torrent.value.publisherId || 
         user.value.role === 'admin' || 
         user.value.role === 'super_admin'
})

const trackerUrl = computed(() => {
  const config = useRuntimeConfig()
  return `${config.public.siteUrl}/api/tracker/announce`
})

// 方法
async function loadInitialData() {
  try {
    // 加载用户信息
    const userResponse = await authApi.getProfile()
    if (userResponse.success && userResponse.data) {
      user.value = userResponse.data
    }

    // 加载种子详情
    await loadTorrent()
    
    // 加载文件列表
    await loadFiles()
    
    // 加载评论
    await loadComments()
  } catch (error) {
    console.error('加载初始数据失败:', error)
  }
}

async function loadTorrent() {
  loading.value = true
  error.value = null
  
  try {
    const response = await torrentApi.getTorrent(torrentId)
    if (response.success && response.data) {
      torrent.value = response.data
    } else {
      error.value = '种子不存在或已被删除'
    }
  } catch (err) {
    console.error('加载种子详情失败:', err)
    error.value = '加载种子详情时发生错误'
  } finally {
    loading.value = false
  }
}

async function loadFiles() {
  if (!torrent.value) return
  
  loadingFiles.value = true
  try {
    const response = await torrentApi.getTorrentFiles(torrent.value.id)
    if (response.success && response.data) {
      files.value = response.data
    }
  } catch (error) {
    console.error('加载文件列表失败:', error)
  } finally {
    loadingFiles.value = false
  }
}

async function loadComments() {
  try {
    const response = await commentApi.getComments(torrentId)
    if (response.success && response.data) {
      comments.value = response.data
    }
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

async function downloadTorrent() {
  if (!user.value) {
    useToast().add({
      title: '请先登录',
      description: '下载种子需要登录账户',
      color: 'warning'
    })
    showAuth.value = true
    return
  }

  if (!torrent.value || torrent.value.status !== 'approved') {
    useToast().add({
      title: '无法下载',
      description: '该种子尚未通过审核',
      color: 'warning'
    })
    return
  }

  downloadLoading.value = true
  try {
    const response = await torrentApi.downloadTorrent(torrentId)
    
    // 处理返回的数据，可能是 URL 或文件内容
    if (typeof response === 'string') {
      // 如果返回的是 URL，直接跳转下载
      window.open(response, '_blank')
    } else if (response instanceof Blob) {
      // 如果返回的是 Blob，创建下载链接
      const url = window.URL.createObjectURL(response)
      const a = document.createElement('a')
      a.href = url
      a.download = `${torrent.value.title}.torrent`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } else {
       // 如果返回的是其他格式，尝试创建 Blob
       const blob = new Blob([JSON.stringify(response)], { type: 'application/x-bittorrent' })
       const url = window.URL.createObjectURL(blob)
       const a = document.createElement('a')
       a.href = url
       a.download = `${torrent.value.title}.torrent`
       document.body.appendChild(a)
       a.click()
       document.body.removeChild(a)
       window.URL.revokeObjectURL(url)
     }

    useToast().add({
      title: '下载成功',
      description: '种子文件已开始下载',
      color: 'success'
    })

    // 重新加载种子信息以更新下载计数
    await loadTorrent()
  } catch (error) {
    console.error('下载种子失败:', error)
    useToast().add({
      title: '下载失败',
      description: '下载种子时发生错误',
      color: 'error'
    })
  } finally {
    downloadLoading.value = false
  }
}

function editTorrent() {
  navigateTo(`/torrents/${torrentId}/edit`)
}

async function addComment() {
  if (!user.value) {
    showAuth.value = true
    return
  }

  if (!newComment.value.trim()) return

  commentLoading.value = true
  try {
    const response = await commentApi.createComment(torrentId, newComment.value.trim())

    if (response.success && response.data) {
      comments.value.unshift(response.data)
      newComment.value = ''
      
      useToast().add({
        title: '评论成功',
        description: '您的评论已发表',
        color: 'success'
      })
    }
  } catch (error) {
    console.error('发表评论失败:', error)
    useToast().add({
      title: '评论失败',
      description: '发表评论时发生错误',
      color: 'error'
    })
  } finally {
    commentLoading.value = false
  }
}

async function deleteComment(commentId: number) {
  try {
    const response = await commentApi.deleteComment(commentId)
    if (response.success) {
      comments.value = comments.value.filter(c => c.id !== commentId)
      
      useToast().add({
        title: '删除成功',
        description: '评论已删除',
        color: 'success'
      })
    }
  } catch (error) {
    console.error('删除评论失败:', error)
    useToast().add({
      title: '删除失败',
      description: '删除评论时发生错误',
      color: 'error'
    })
  }
}

function canDeleteComment(comment: Comment): boolean {
  if (!user.value) return false
  return user.value.id === comment.userId || 
         user.value.role === 'admin' || 
         user.value.role === 'super_admin'
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'mp4':
    case 'avi':
    case 'mkv':
    case 'mov':
    case 'wmv':
      return 'i-heroicons-film'
    case 'mp3':
    case 'flac':
    case 'wav':
    case 'aac':
      return 'i-heroicons-musical-note'
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
      return 'i-heroicons-photo'
    case 'txt':
    case 'md':
    case 'readme':
      return 'i-heroicons-document-text'
    case 'zip':
    case 'rar':
    case '7z':
      return 'i-heroicons-archive-box'
    default:
      return 'i-heroicons-document'
  }
}

function formatDescription(description: string): string {
  // 简单的 Markdown 转换
  return description
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
}

function handleAuthSuccess(userData: User) {
  user.value = userData
  showAuth.value = false
}

// 页面初始化
onMounted(() => {
  loadInitialData()
})

// 监听路由变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    const newTorrentId = parseInt(newId as string)
    if (newTorrentId !== torrentId) {
      window.location.reload()
    }
  }
})
</script>