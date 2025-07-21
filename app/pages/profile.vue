<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 头部导航 -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <UButton @click="$router.back()" variant="ghost" icon="i-heroicons-arrow-left" class="mr-4">
              返回
            </UButton>
            <h1 class="text-xl font-semibold">个人中心</h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <UDropdownMenu :items="userMenuItems">
              <UButton variant="ghost" :label="user?.username" trailing-icon="i-heroicons-chevron-down-20-solid" />
            </UDropdownMenu>
          </div>
        </div>
      </div>
    </header>

    <!-- 主要内容 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" />
      </div>

      <div v-else-if="!user" class="text-center py-12">
        <UIcon name="i-heroicons-user-circle" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 mb-2">请先登录</h2>
        <p class="text-gray-600 mb-4">您需要登录后才能查看个人中心</p>
        <UButton to="/auth/login">立即登录</UButton>
      </div>

      <div v-else class="space-y-6">
        <!-- 用户信息卡片 -->
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-lg font-semibold">个人信息</h2>
              <UButton @click="showEditProfile = true" variant="outline" size="sm" icon="i-heroicons-pencil">
                编辑资料
              </UButton>
            </div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="flex items-center space-x-4">
                <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {{ user.username.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <h3 class="text-xl font-semibold">{{ user.username }}</h3>
                  <p class="text-gray-600">{{ getRoleDisplayName(user.role) }}</p>
                </div>
              </div>
              
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-600">邮箱:</span>
                  <span class="font-medium">{{ user.email }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">注册时间:</span>
                  <span class="font-medium">{{ formatDate(user.createdAt) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">最后登录:</span>
                  <span class="font-medium">{{ formatDate(user.lastLoginAt) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">账户状态:</span>
                  <UBadge :color="user.isActive ? 'success' : 'error'" variant="soft">
                    {{ user.isActive ? '正常' : '已禁用' }}
                  </UBadge>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="font-semibold text-gray-900">统计信息</h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                  <div class="text-2xl font-bold text-blue-600">{{ userStats.uploadedTorrents }}</div>
                  <div class="text-sm text-gray-600">上传种子</div>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                  <div class="text-2xl font-bold text-green-600">{{ userStats.downloadedTorrents }}</div>
                  <div class="text-sm text-gray-600">下载种子</div>
                </div>
                <div class="text-center p-4 bg-purple-50 rounded-lg">
                  <div class="text-2xl font-bold text-purple-600">{{ formatFileSize(userStats.uploadedBytes) }}</div>
                  <div class="text-sm text-gray-600">上传量</div>
                </div>
                <div class="text-center p-4 bg-orange-50 rounded-lg">
                  <div class="text-2xl font-bold text-orange-600">{{ formatFileSize(userStats.downloadedBytes) }}</div>
                  <div class="text-sm text-gray-600">下载量</div>
                </div>
              </div>
              
              <div class="mt-4">
                <div class="flex justify-between text-sm mb-1">
                  <span>分享率</span>
                  <span class="font-medium">{{ shareRatio }}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-blue-600 h-2 rounded-full" 
                    :style="{ width: Math.min(shareRatioPercent, 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- 我的种子 -->
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-lg font-semibold">我的种子</h2>
              <div class="flex gap-2">
                <USelect
                  v-model="torrentFilter"
                  :options="torrentFilterOptions"
                  @change="loadMyTorrents"
                  size="sm"
                />
                <UButton to="/torrents/upload" size="sm" icon="i-heroicons-plus">
                  上传种子
                </UButton>
              </div>
            </div>
          </template>

          <div v-if="loadingTorrents" class="flex justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin" />
          </div>

          <div v-else-if="myTorrents.length === 0" class="text-center py-8 text-gray-500">
            暂无种子数据
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="torrent in myTorrents"
              :key="torrent.id"
              class="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <h3 class="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                      {{ torrent.title }}
                    </h3>
                    <UBadge
                      :color="getStatusColor(torrent.status)"
                      variant="soft"
                      size="xs"
                    >
                      {{ getStatusDisplayName(torrent.status) }}
                    </UBadge>
                  </div>
                  
                  <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                    <span class="flex items-center">
                      <UIcon name="i-heroicons-tag" class="w-4 h-4 mr-1" />
                      {{ torrent.category?.name }}
                    </span>
                    <span class="flex items-center">
                      <UIcon name="i-heroicons-hard-drive" class="w-4 h-4 mr-1" />
                      {{ formatFileSize(torrent.size) }}
                    </span>
                    <span class="flex items-center">
                      <UIcon name="i-heroicons-document-duplicate" class="w-4 h-4 mr-1" />
                      {{ torrent.fileCount }} 个文件
                    </span>
                    <span class="text-gray-500">
                      {{ formatDate(torrent.createdAt) }}
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-4 text-sm">
                    <span class="flex items-center text-green-600">
                      <UIcon name="i-heroicons-arrow-up" class="w-4 h-4 mr-1" />
                      {{ torrent.seeders }} 做种
                    </span>
                    <span class="flex items-center text-red-600">
                      <UIcon name="i-heroicons-arrow-down" class="w-4 h-4 mr-1" />
                      {{ torrent.leechers }} 下载
                    </span>
                    <span class="flex items-center text-blue-600">
                      <UIcon name="i-heroicons-arrow-down-circle" class="w-4 h-4 mr-1" />
                      {{ torrent.downloads }} 完成
                    </span>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <UButton
                    @click="viewTorrent(torrent.id)"
                    variant="outline"
                    size="sm"
                    icon="i-heroicons-eye"
                  >
                    查看
                  </UButton>
                  <UButton
                    @click="editTorrent(torrent.id)"
                    variant="outline"
                    size="sm"
                    icon="i-heroicons-pencil"
                  >
                    编辑
                  </UButton>
                  <UButton
                    @click="deleteTorrent(torrent.id)"
                    color="error"
                    variant="outline"
                    size="sm"
                    icon="i-heroicons-trash"
                  >
                    删除
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <template #footer v-if="totalTorrentPages > 1">
            <div class="flex justify-center">
              <UPagination
                v-model="currentTorrentPage"
                :page-count="totalTorrentPages"
                :total="totalMyTorrents"
                @update:model-value="loadMyTorrents"
              />
            </div>
          </template>
        </UCard>

        <!-- 下载历史 -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">下载历史</h2>
          </template>

          <div v-if="loadingDownloads" class="flex justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin" />
          </div>

          <div v-else-if="downloadHistory.length === 0" class="text-center py-8 text-gray-500">
            暂无下载记录
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="download in downloadHistory"
              :key="download.id"
              class="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
            >
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">{{ download.torrent?.title }}</h4>
                <p class="text-sm text-gray-600">{{ formatDate(download.downloadedAt) }}</p>
              </div>
              <div class="text-sm text-gray-600">
                {{ formatFileSize(download.torrent?.size || 0) }}
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- 编辑资料模态框 -->
    <UModal v-model="showEditProfile">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">编辑个人资料</h3>
        </template>
        
        <UForm :state="profileForm" @submit="updateProfile" class="space-y-4">
          <UFormField label="用户名" name="username">
            <UInput v-model="profileForm.username" placeholder="请输入用户名" />
          </UFormField>
          
          <UFormField label="邮箱" name="email">
            <UInput v-model="profileForm.email" type="email" placeholder="请输入邮箱地址" />
          </UFormField>
          
          <UFormField label="新密码" name="password" help="留空则不修改密码">
            <UInput v-model="profileForm.password" type="password" placeholder="请输入新密码" />
          </UFormField>
          
          <UFormField label="确认新密码" name="confirmPassword">
            <UInput v-model="profileForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
          </UFormField>
          
          <div class="flex justify-end gap-2">
            <UButton @click="showEditProfile = false" variant="outline">取消</UButton>
            <UButton type="submit" :loading="updateLoading">保存</UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { User, Torrent, UserStats, DownloadHistory } from '~/types'
import { authApi, torrentApi, userApi } from '~/utils/api'
import { formatFileSize, formatDate, getStatusColor, getStatusDisplayName, getRoleDisplayName } from '~/utils'

// 页面元数据
definePageMeta({
  title: '个人中心',
  middleware: 'auth'
})

// 响应式数据
const loading = ref(true)
const loadingTorrents = ref(false)
const loadingDownloads = ref(false)
const updateLoading = ref(false)

const user = ref<User | null>(null)
const userStats = ref<UserStats>({
  uploadedTorrents: 0,
  downloadedTorrents: 0,
  uploadedBytes: 0,
  downloadedBytes: 0,
  shareRatio: 0
})

const myTorrents = ref<Torrent[]>([])
const downloadHistory = ref<DownloadHistory[]>([])

const showEditProfile = ref(false)
const torrentFilter = ref('all')
const currentTorrentPage = ref(1)
const totalMyTorrents = ref(0)
const totalTorrentPages = ref(0)

// 表单数据
const profileForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 计算属性
const shareRatio = computed(() => {
  if (userStats.value.downloadedBytes === 0) return '∞'
  return (userStats.value.uploadedBytes / userStats.value.downloadedBytes).toFixed(2)
})

const shareRatioPercent = computed(() => {
  if (userStats.value.downloadedBytes === 0) return 100
  return (userStats.value.uploadedBytes / userStats.value.downloadedBytes) * 100
})

const torrentFilterOptions = [
  { label: '全部', value: 'all' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' }
]

const userMenuItems = computed(() => [
  [{
    label: '我的种子',
    icon: 'i-heroicons-document-text',
    click: () => navigateTo('/my-torrents')
  }],
  [{
    label: '退出登录',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: handleLogout
  }]
])

// 方法
async function loadUserProfile() {
  loading.value = true
  try {
    const response = await authApi.getProfile()
    if (response.success && response.data) {
      user.value = response.data
      
      // 初始化表单数据
      profileForm.value.username = response.data.username
      profileForm.value.email = response.data.email
      
      await Promise.all([
        loadUserStats(),
        loadMyTorrents(),
        loadDownloadHistory()
      ])
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    useToast().add({
      title: '加载失败',
      description: '无法加载用户信息',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function loadUserStats() {
  if (!user.value) return
  
  try {
    const response = await userApi.getUserStats(user.value.id)
    if (response.success && response.data) {
      userStats.value = response.data
    }
  } catch (error) {
    console.error('加载用户统计失败:', error)
  }
}

async function loadMyTorrents() {
  if (!user.value) return
  
  loadingTorrents.value = true
  try {
    const response = await torrentApi.getTorrents({
      page: currentTorrentPage.value,
      limit: 10,
      userId: user.value.id,
      status: torrentFilter.value === 'all' ? undefined : torrentFilter.value as any
    })
    
    if (response.success && response.data) {
      myTorrents.value = response.data.data
      totalMyTorrents.value = response.data.total
      totalTorrentPages.value = response.data.totalPages
    }
  } catch (error) {
    console.error('加载我的种子失败:', error)
  } finally {
    loadingTorrents.value = false
  }
}

async function loadDownloadHistory() {
  if (!user.value) return
  
  loadingDownloads.value = true
  try {
    const response = await userApi.getUserDownloadHistory(user.value.id)
    if (response.success && response.data) {
      downloadHistory.value = response.data
    }
  } catch (error) {
    console.error('加载下载历史失败:', error)
  } finally {
    loadingDownloads.value = false
  }
}

async function updateProfile() {
  if (profileForm.value.password && profileForm.value.password !== profileForm.value.confirmPassword) {
    useToast().add({
      title: '更新失败',
      description: '两次输入的密码不一致',
      color: 'error'
    })
    return
  }
  
  updateLoading.value = true
  try {
    const updateData: any = {
      username: profileForm.value.username,
      email: profileForm.value.email
    }
    
    if (profileForm.value.password) {
      updateData.password = profileForm.value.password
    }
    
    const response = await userApi.updateUser(user.value!.id, updateData)
    if (response.success && response.data) {
      user.value = response.data
      showEditProfile.value = false
      
      useToast().add({
        title: '更新成功',
        description: '个人资料已更新',
        color: 'success'
      })
    }
  } catch (error) {
    console.error('更新个人资料失败:', error)
    useToast().add({
      title: '更新失败',
      description: '更新个人资料时发生错误',
      color: 'error'
    })
  } finally {
    updateLoading.value = false
  }
}

function viewTorrent(id: number) {
  navigateTo(`/torrents/${id}`)
}

function editTorrent(id: number) {
  navigateTo(`/torrents/${id}/edit`)
}

async function deleteTorrent(id: number) {
  const confirmed = confirm('确定要删除这个种子吗？此操作不可撤销。')
  if (!confirmed) return
  
  try {
    const response = await torrentApi.deleteTorrent(id)
    if (response.success) {
      useToast().add({
        title: '删除成功',
        description: '种子已删除',
        color: 'success'
      })
      
      await loadMyTorrents()
    }
  } catch (error) {
    console.error('删除种子失败:', error)
    useToast().add({
      title: '删除失败',
      description: '删除种子时发生错误',
      color: 'error'
    })
  }
}

async function handleLogout() {
  try {
    await authApi.logout()
    await navigateTo('/')
    
    useToast().add({
      title: '退出成功',
      description: '您已成功退出登录',
      color: 'success'
    })
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

// 页面初始化
onMounted(() => {
  loadUserProfile()
})
</script>