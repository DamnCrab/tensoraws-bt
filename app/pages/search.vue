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
            <NuxtLink to="/" class="text-xl font-bold text-blue-600">AnimeBT</NuxtLink>
          </div>
          
          <div class="flex items-center space-x-4">
            <div v-if="user" class="flex items-center space-x-2">
              <UDropdownMenu :items="userMenuItems">
                <UButton variant="ghost" :label="user.username" trailing-icon="i-heroicons-chevron-down-20-solid" />
              </UDropdownMenu>
            </div>
            <div v-else class="flex space-x-2">
              <UButton @click="showLogin = true" variant="outline">登录</UButton>
              <UButton @click="showRegister = true">注册</UButton>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 搜索区域 -->
    <div class="bg-white border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="space-y-4">
          <!-- 主搜索框 -->
          <div class="flex gap-4">
            <div class="flex-1">
              <UInput
                v-model="searchQuery"
                placeholder="搜索种子..."
                icon="i-heroicons-magnifying-glass-20-solid"
                size="lg"
                @keyup.enter="performSearch"
              />
            </div>
            <UButton @click="performSearch" size="lg" icon="i-heroicons-magnifying-glass-20-solid">
              搜索
            </UButton>
          </div>

          <!-- 高级搜索选项 -->
          <div class="flex flex-wrap gap-4">
            <USelect
              v-model="selectedCategory"
              :options="categoryOptions"
              placeholder="选择分类"
              size="sm"
              @change="performSearch"
            />
            <USelect
              v-model="selectedPublishGroup"
              :options="publishGroupOptions"
              placeholder="选择发布组"
              size="sm"
              @change="performSearch"
            />
            <USelect
              v-model="sortBy"
              :options="sortOptions"
              size="sm"
              @change="performSearch"
            />
            <USelect
              v-model="sortOrder"
              :options="orderOptions"
              size="sm"
              @change="performSearch"
            />
            <UButton @click="toggleAdvancedSearch" variant="outline" size="sm">
              {{ showAdvancedSearch ? '隐藏高级搜索' : '高级搜索' }}
            </UButton>
          </div>

          <!-- 高级搜索面板 -->
          <UCard v-if="showAdvancedSearch" class="mt-4">
            <template #header>
              <h3 class="text-lg font-semibold">高级搜索选项</h3>
            </template>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <UFormField label="文件大小范围">
                <div class="flex gap-2 items-center">
                  <UInput
                    v-model="minSize"
                    placeholder="最小"
                    size="sm"
                    type="number"
                  />
                  <span class="text-gray-500">-</span>
                  <UInput
                    v-model="maxSize"
                    placeholder="最大"
                    size="sm"
                    type="number"
                  />
                  <USelect
                    v-model="sizeUnit"
                    :options="sizeUnitOptions"
                    size="sm"
                  />
                </div>
              </UFormField>

              <UFormField label="发布时间">
                <USelect
                  v-model="timeRange"
                  :options="timeRangeOptions"
                  size="sm"
                />
              </UFormField>

              <UFormField label="种子状态">
                <USelect
                  v-model="torrentStatus"
                  :options="statusOptions"
                  size="sm"
                />
              </UFormField>

              <UFormField label="做种数范围">
                <div class="flex gap-2 items-center">
                  <UInput
                    v-model="minSeeders"
                    placeholder="最小"
                    size="sm"
                    type="number"
                  />
                  <span class="text-gray-500">-</span>
                  <UInput
                    v-model="maxSeeders"
                    placeholder="最大"
                    size="sm"
                    type="number"
                  />
                </div>
              </UFormField>

              <UFormField label="下载数范围">
                <div class="flex gap-2 items-center">
                  <UInput
                    v-model="minLeechers"
                    placeholder="最小"
                    size="sm"
                    type="number"
                  />
                  <span class="text-gray-500">-</span>
                  <UInput
                    v-model="maxLeechers"
                    placeholder="最大"
                    size="sm"
                    type="number"
                  />
                </div>
              </UFormField>

              <UFormField label="标签">
                <UInput
                  v-model="tags"
                  placeholder="用逗号分隔多个标签"
                  size="sm"
                />
              </UFormField>
            </div>

            <template #footer>
              <div class="flex justify-end gap-2">
                <UButton @click="resetAdvancedSearch" variant="outline" size="sm">
                  重置
                </UButton>
                <UButton @click="performSearch" size="sm">
                  应用筛选
                </UButton>
              </div>
            </template>
          </UCard>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- 结果统计 -->
      <div class="flex justify-between items-center mb-6">
        <div class="text-gray-600">
          <span v-if="searchPerformed">
            找到 <span class="font-semibold text-gray-900">{{ totalResults }}</span> 个结果
            <span v-if="searchQuery">"{{ searchQuery }}"</span>
          </span>
          <span v-else>请输入关键词进行搜索</span>
        </div>
        
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">每页显示:</span>
          <USelect
            v-model="pageSize"
            :options="pageSizeOptions"
            size="sm"
            @change="performSearch"
          />
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-blue-500" />
      </div>

      <!-- 搜索结果列表 -->
      <div v-else-if="searchPerformed && torrents.length > 0" class="space-y-4">
        <UCard
          v-for="torrent in torrents"
          :key="torrent.id"
          class="hover:shadow-md transition-shadow"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <NuxtLink
                  :to="`/torrents/${torrent.id}`"
                  class="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {{ torrent.title }}
                </NuxtLink>
                <UBadge :color="getStatusColor(torrent.status)" variant="soft">
                  {{ getStatusDisplayName(torrent.status) }}
                </UBadge>
              </div>
              
              <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-tag" class="w-4 h-4" />
                  {{ torrent.category?.name }}
                </span>
                <span v-if="torrent.publishGroup" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
                  {{ torrent.publishGroup.name }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-hard-drive" class="w-4 h-4" />
                  {{ formatFileSize(torrent.size) }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
                  {{ torrent.fileCount }} 个文件
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-user" class="w-4 h-4" />
                  {{ torrent.publisher?.username }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                  {{ formatDate(torrent.createdAt) }}
                </span>
              </div>

              <div class="flex items-center gap-6 text-sm">
                <span class="flex items-center gap-1 text-green-600">
                  <UIcon name="i-heroicons-arrow-up" class="w-4 h-4" />
                  {{ torrent.seeders }} 做种
                </span>
                <span class="flex items-center gap-1 text-red-600">
                  <UIcon name="i-heroicons-arrow-down" class="w-4 h-4" />
                  {{ torrent.leechers }} 下载
                </span>
                <span class="flex items-center gap-1 text-blue-600">
                  <UIcon name="i-heroicons-arrow-down-circle" class="w-4 h-4" />
                  {{ torrent.downloads }} 完成
                </span>
              </div>

              <!-- 标签 -->
              <div v-if="torrent.tags && torrent.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
                <UBadge
                  v-for="tag in torrent.tags"
                  :key="tag"
                  variant="outline"
                  size="xs"
                >
                  {{ tag }}
                </UBadge>
              </div>

              <!-- 描述预览 -->
              <p v-if="torrent.description" class="text-gray-600 text-sm mt-2 line-clamp-2">
                {{ truncateText(torrent.description, 200) }}
              </p>
            </div>

            <div class="flex flex-col gap-2 ml-4">
              <UButton
                @click="downloadTorrent(torrent)"
                :disabled="torrent.status !== 'approved'"
                icon="i-heroicons-arrow-down-tray"
                size="sm"
              >
                下载
              </UButton>
              <UButton
                @click="viewTorrent(torrent.id)"
                variant="outline"
                icon="i-heroicons-eye"
                size="sm"
              >
                详情
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- 无结果 -->
      <div v-else-if="searchPerformed && torrents.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 mb-2">未找到相关结果</h3>
        <p class="text-gray-600">请尝试调整搜索条件或关键词</p>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="flex justify-center mt-8">
        <UPagination
          v-model="currentPage"
          :page-count="totalPages"
          :total="totalResults"
          @update:model-value="performSearch"
        />
      </div>
    </div>

    <!-- 登录模态框 -->
    <UModal v-model="showLogin">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">用户登录</h3>
        </template>
        
        <UForm :state="loginForm" @submit="handleLogin" class="space-y-4">
          <UFormField label="用户名或邮箱" name="username" required>
            <UInput v-model="loginForm.username" placeholder="请输入用户名或邮箱" />
          </UFormField>
          
          <UFormField label="密码" name="password" required>
            <UInput v-model="loginForm.password" type="password" placeholder="请输入密码" />
          </UFormField>
          
          <div class="flex justify-end gap-2">
            <UButton @click="showLogin = false" variant="outline">取消</UButton>
            <UButton type="submit" :loading="loginLoading">登录</UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>

    <!-- 注册模态框 -->
    <UModal v-model="showRegister">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">用户注册</h3>
        </template>
        
        <UForm :state="registerForm" @submit="handleRegister" class="space-y-4">
          <UFormField label="用户名" name="username" required>
            <UInput v-model="registerForm.username" placeholder="请输入用户名" />
          </UFormField>
          
          <UFormField label="邮箱" name="email" required>
            <UInput v-model="registerForm.email" type="email" placeholder="请输入邮箱" />
          </UFormField>
          
          <UFormField label="密码" name="password" required>
            <UInput v-model="registerForm.password" type="password" placeholder="请输入密码" />
          </UFormField>
          
          <UFormField label="确认密码" name="confirmPassword" required>
            <UInput v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" />
          </UFormField>
          
          <div class="flex justify-end gap-2">
            <UButton @click="showRegister = false" variant="outline">取消</UButton>
            <UButton type="submit" :loading="registerLoading">注册</UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { User, Torrent, Category, PublishGroup, TorrentSearchParams } from '~/types'
import { authApi, torrentApi, categoryApi, publishGroupApi } from '~/utils/api'
import { formatFileSize, formatDate, truncateText, getStatusColor, getStatusDisplayName } from '~/utils'

// 页面元数据
definePageMeta({
  title: '搜索种子'
})

// 响应式数据
const user = ref<User | null>(null)
const loading = ref(false)
const searchPerformed = ref(false)

// 搜索参数
const searchQuery = ref('')
const selectedCategory = ref<number | null>(null)
const selectedPublishGroup = ref<number | null>(null)
const sortBy = ref('createdAt')
const sortOrder = ref('desc')
const currentPage = ref(1)
const pageSize = ref(20)

// 高级搜索
const showAdvancedSearch = ref(false)
const minSize = ref<number | null>(null)
const maxSize = ref<number | null>(null)
const sizeUnit = ref('GB')
const timeRange = ref('all')
const torrentStatus = ref('approved')
const minSeeders = ref<number | null>(null)
const maxSeeders = ref<number | null>(null)
const minLeechers = ref<number | null>(null)
const maxLeechers = ref<number | null>(null)
const tags = ref('')

// 搜索结果
const torrents = ref<Torrent[]>([])
const totalResults = ref(0)
const totalPages = ref(0)

// 基础数据
const categories = ref<Category[]>([])
const publishGroups = ref<PublishGroup[]>([])

// 用户认证
const showLogin = ref(false)
const showRegister = ref(false)
const loginLoading = ref(false)
const registerLoading = ref(false)

const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 计算属性
const categoryOptions = computed(() => [
  { label: '全部分类', value: null },
  ...categories.value.map(cat => ({ label: cat.name, value: cat.id }))
])

const publishGroupOptions = computed(() => [
  { label: '全部发布组', value: null },
  ...publishGroups.value.map(group => ({ label: group.name, value: group.id }))
])

const sortOptions = [
  { label: '发布时间', value: 'createdAt' },
  { label: '文件大小', value: 'size' },
  { label: '下载次数', value: 'downloads' },
  { label: '做种数', value: 'seeders' },
  { label: '标题', value: 'title' }
]

const orderOptions = [
  { label: '降序', value: 'desc' },
  { label: '升序', value: 'asc' }
]

const pageSizeOptions = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: '100', value: 100 }
]

const sizeUnitOptions = [
  { label: 'MB', value: 'MB' },
  { label: 'GB', value: 'GB' },
  { label: 'TB', value: 'TB' }
]

const timeRangeOptions = [
  { label: '全部时间', value: 'all' },
  { label: '今天', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本年', value: 'year' }
]

const statusOptions = [
  { label: '已通过', value: 'approved' },
  { label: '全部状态', value: 'all' },
  { label: '待审核', value: 'pending' },
  { label: '已拒绝', value: 'rejected' }
]

const userMenuItems = computed(() => [
  [{
    label: '个人中心',
    icon: 'i-heroicons-user',
    click: () => navigateTo('/profile')
  }],
  [{
    label: '上传种子',
    icon: 'i-heroicons-arrow-up-tray',
    click: () => navigateTo('/torrents/upload')
  }],
  [{
    label: '管理后台',
    icon: 'i-heroicons-cog-6-tooth',
    click: () => navigateTo('/admin'),
    disabled: !user.value || (user.value.role !== 'admin' && user.value.role !== 'super_admin')
  }],
  [{
    label: '退出登录',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: handleLogout
  }]
])

// 方法
async function loadInitialData() {
  try {
    // 加载用户信息
    const userResponse = await authApi.getProfile()
    if (userResponse.success && userResponse.data) {
      user.value = userResponse.data
    }

    // 加载分类和发布组
    const [categoriesResponse, publishGroupsResponse] = await Promise.all([
      categoryApi.getCategories(),
      publishGroupApi.getPublishGroups()
    ])

    if (categoriesResponse.success && categoriesResponse.data) {
      categories.value = categoriesResponse.data.filter(cat => cat.isActive)
    }

    if (publishGroupsResponse.success && publishGroupsResponse.data) {
      publishGroups.value = publishGroupsResponse.data.filter(group => group.isActive)
    }

    // 检查URL参数
    const route = useRoute()
    if (route.query.q) {
      searchQuery.value = route.query.q as string
      await performSearch()
    }
  } catch (error) {
    console.error('加载初始数据失败:', error)
  }
}

async function performSearch() {
  loading.value = true
  searchPerformed.value = true

  try {
    const params: TorrentSearchParams = {
      page: currentPage.value,
      limit: pageSize.value,
      sort: sortBy.value as any,
      order: sortOrder.value as any
    }

    // 基础搜索参数
    if (searchQuery.value.trim()) {
      params.q = searchQuery.value.trim()
    }
    if (selectedCategory.value) {
      params.category = selectedCategory.value.toString()
    }
    if (selectedPublishGroup.value) {
      params.publishGroup = selectedPublishGroup.value.toString()
    }

    // 高级搜索参数
    if (showAdvancedSearch.value) {
      if (minSize.value !== null && maxSize.value !== null) {
        const multiplier = sizeUnit.value === 'TB' ? 1024 * 1024 * 1024 * 1024 :
                          sizeUnit.value === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024
        params.minSize = minSize.value * multiplier
        params.maxSize = maxSize.value * multiplier
      }
      
      if (timeRange.value !== 'all') {
        params.timeRange = timeRange.value as 'all' | 'today' | 'week' | 'month' | 'year'
      }
      
      if (torrentStatus.value !== 'all') {
        params.status = torrentStatus.value as any
      }
      
      if (minSeeders.value !== null) {
        params.minSeeders = minSeeders.value
      }
      if (maxSeeders.value !== null) {
        params.maxSeeders = maxSeeders.value
      }
      if (minLeechers.value !== null) {
        params.minLeechers = minLeechers.value
      }
      if (maxLeechers.value !== null) {
        params.maxLeechers = maxLeechers.value
      }
      if (tags.value.trim()) {
        params.tags = tags.value.trim()
      }
    }

    const response = await torrentApi.getTorrents(params)
    
    if (response.success && response.data) {
      torrents.value = response.data.data
      totalResults.value = response.data.total
      totalPages.value = response.data.totalPages
    }

    // 更新URL
    const query: Record<string, string> = {}
    if (searchQuery.value.trim()) {
      query.q = searchQuery.value.trim()
    }
    await navigateTo({ query }, { replace: true })
  } catch (error) {
    console.error('搜索失败:', error)
    useToast().add({
      title: '搜索失败',
      description: '搜索时发生错误，请稍后重试',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

function toggleAdvancedSearch() {
  showAdvancedSearch.value = !showAdvancedSearch.value
}

function resetAdvancedSearch() {
  minSize.value = null
  maxSize.value = null
  sizeUnit.value = 'GB'
  timeRange.value = 'all'
  torrentStatus.value = 'approved'
  minSeeders.value = null
  maxSeeders.value = null
  minLeechers.value = null
  maxLeechers.value = null
  tags.value = ''
}

async function downloadTorrent(torrent: Torrent) {
  if (!user.value) {
    useToast().add({
      title: '请先登录',
      description: '下载种子需要登录账户',
      color: 'warning'
    })
    showLogin.value = true
    return
  }

  if (torrent.status !== 'approved') {
    useToast().add({
      title: '无法下载',
      description: '该种子尚未通过审核',
      color: 'warning'
    })
    return
  }

  try {
    const response = await torrentApi.downloadTorrent(torrent.id)
    if (response.url) {
      // 如果返回的是URL，直接跳转下载
      window.open(response.url, '_blank')
    } else if (response.content) {
      // 如果返回的是文件内容，创建下载链接
      const blob = new Blob([response.content], { type: 'application/x-bittorrent' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${torrent.title}.torrent`
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
  } catch (error) {
    console.error('下载种子失败:', error)
    useToast().add({
      title: '下载失败',
      description: '下载种子时发生错误',
      color: 'error'
    })
  }
}

function viewTorrent(id: number) {
  navigateTo(`/torrents/${id}`)
}

async function handleLogin() {
  loginLoading.value = true
  try {
    const response = await authApi.login(loginForm.value)
    if (response.success && response.data) {
      user.value = response.data.user
      showLogin.value = false
      
      useToast().add({
        title: '登录成功',
        description: '欢迎回来！',
        color: 'success'
      })
      
      // 重置表单
      loginForm.value = { username: '', password: '' }
    }
  } catch (error) {
    console.error('登录失败:', error)
    useToast().add({
      title: '登录失败',
      description: '用户名或密码错误',
      color: 'error'
    })
  } finally {
    loginLoading.value = false
  }
}

async function handleRegister() {
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    useToast().add({
      title: '注册失败',
      description: '两次输入的密码不一致',
      color: 'error'
    })
    return
  }

  registerLoading.value = true
  try {
    const response = await authApi.register({
      username: registerForm.value.username,
      email: registerForm.value.email,
      password: registerForm.value.password
    })
    
    if (response.success && response.data) {
      user.value = response.data
      showRegister.value = false
      
      useToast().add({
        title: '注册成功',
        description: '欢迎加入 AnimeBT！',
        color: 'success'
      })
      
      // 重置表单
      registerForm.value = { username: '', email: '', password: '', confirmPassword: '' }
    }
  } catch (error) {
    console.error('注册失败:', error)
    useToast().add({
      title: '注册失败',
      description: '注册时发生错误，请稍后重试',
      color: 'error'
    })
  } finally {
    registerLoading.value = false
  }
}

async function handleLogout() {
  try {
    await authApi.logout()
    user.value = null
    
    useToast().add({
      title: '退出成功',
      description: '您已成功退出登录',
      color: 'success'
    })
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

// 监听搜索参数变化
watch([selectedCategory, selectedPublishGroup, sortBy, sortOrder], () => {
  if (searchPerformed.value) {
    currentPage.value = 1
    performSearch()
  }
})

watch(currentPage, () => {
  if (searchPerformed.value) {
    performSearch()
  }
})

// 页面初始化
onMounted(() => {
  loadInitialData()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>