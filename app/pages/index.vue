<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 欢迎横幅 -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="text-center">
          <!-- <h1 class="text-4xl font-bold mb-4">欢迎来到 AnimeBT</h1> -->
          <!-- <p class="text-xl text-blue-100 mb-8">专业的动漫资源分享平台</p> -->
          
          <!-- 搜索栏 -->
          <div class="max-w-2xl mx-auto">
            <div class="flex gap-4">
              <div class="flex-1">
                <UInput
                  v-model="searchQuery"
                  placeholder="搜索动漫、电影、音乐..."
                  icon="i-heroicons-magnifying-glass-20-solid"
                  size="lg"
                  @keyup.enter="performSearch"
                  class="w-full"
                />
              </div>
              <USelect
                v-model="selectedCategory"
                :options="categoryOptions"
                placeholder="分类"
                size="lg"
                class="w-32"
              />
              <UButton @click="performSearch" size="lg" icon="i-heroicons-magnifying-glass-20-solid">
                搜索
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UCard>
          <div class="flex items-center">
            <div class="p-3 bg-blue-100 rounded-lg">
              <UIcon name="i-heroicons-document-text" class="w-6 h-6 text-blue-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">总种子数</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalTorrents }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center">
            <div class="p-3 bg-green-100 rounded-lg">
              <UIcon name="i-heroicons-arrow-up" class="w-6 h-6 text-green-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">活跃种子</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.activeTorrents }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center">
            <div class="p-3 bg-purple-100 rounded-lg">
              <UIcon name="i-heroicons-arrow-down-circle" class="w-6 h-6 text-purple-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">总下载量</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalDownloads }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- 种子列表 -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">最新种子</h2>
        <div class="flex items-center gap-4">
          <USelect
            v-model="sortBy"
            :options="sortOptions"
            @change="loadTorrents"
            size="sm"
          />
          <UButton 
            v-if="user" 
            @click="navigateTo('/torrents/upload')" 
            icon="i-heroicons-plus"
          >
            上传种子
          </UButton>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-blue-500" />
      </div>

      <!-- 种子卡片列表 -->
      <div v-else-if="torrents.length > 0" class="space-y-4">
        <TorrentCard
          v-for="torrent in torrents"
          :key="torrent.id"
          :torrent="torrent"
          :user="user"
          @download="downloadTorrent"
          @view="viewTorrent"
        />
      </div>

      <!-- 无数据状态 -->
      <div v-else class="text-center py-12">
        <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 mb-2">暂无种子</h3>
        <p class="text-gray-600">还没有任何种子，快来上传第一个吧！</p>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="flex justify-center mt-8">
        <UPagination
          v-model="currentPage"
          :page-count="totalPages"
          :total="totalTorrents"
          @update:model-value="loadTorrents"
        />
      </div>
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
import type { User, Torrent, Category, TorrentStats } from '~/types'

// 使用 composables
const { getProfile } = useAuth()
const { getTorrents, downloadTorrent: downloadTorrentFile } = useTorrents()
const { getCategories } = useCategories()

// 页面元数据
definePageMeta({
  title: 'AnimeBT - 专业的动漫资源分享平台'
})

// 响应式数据
const user = ref<User | null>(null)
const loading = ref(false)
const showAuth = ref(false)
const authMode = ref<'login' | 'register'>('login')

// 搜索相关
const searchQuery = ref('')
const selectedCategory = ref<number | null>(null)

// 种子列表
const torrents = ref<Torrent[]>([])
const currentPage = ref(1)
const totalTorrents = ref(0)
const totalPages = ref(0)
const sortBy = ref('createdAt')

// 基础数据
const categories = ref<Category[]>([])
const stats = ref<TorrentStats>({
  totalTorrents: 0,
  activeTorrents: 0,
  totalSeeders: 0,
  totalLeechers: 0,
  totalDownloads: 0
})

// 计算属性
const categoryOptions = computed(() => [
  { label: '全部分类', value: null },
  ...categories.value.map((cat: Category) => ({ label: cat.name, value: cat.id }))
])

const sortOptions = [
  { label: '最新发布', value: 'createdAt' },
  { label: '最多下载', value: 'downloads' },
  { label: '最多做种', value: 'seeders' },
  { label: '文件大小', value: 'size' }
]

// 方法
async function loadInitialData() {
  try {
    // 加载用户信息
    const userResponse = await getProfile()
    if (userResponse.success && userResponse.data) {
      user.value = userResponse.data
    }

    // 加载分类
    const categoriesResponse = await getCategories()
    if (categoriesResponse.success && categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
      categories.value = categoriesResponse.data.filter((cat: Category) => cat.isActive)
    }

    // 加载统计数据
    await loadStats()
    
    // 加载种子列表
    await loadTorrents()
  } catch (error) {
    console.error('加载初始数据失败:', error)
  }
}

async function loadStats() {
  try {
    // 这里应该调用统计API，暂时使用模拟数据
    stats.value = {
      totalTorrents: 1234,
      activeTorrents: 856,
      totalSeeders: 2345,
      totalLeechers: 1234,
      totalDownloads: 98765
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

async function loadTorrents() {
  loading.value = true
  try {
    const response = await getTorrents({
      page: currentPage.value,
      limit: 20,
      sort: sortBy.value as any,
      order: 'desc',
      status: 'approved'
    })
    
    if (response.success && response.data) {
      torrents.value = response.data.data
      totalTorrents.value = response.data.total
      totalPages.value = response.data.totalPages
    }
  } catch (error) {
    console.error('加载种子列表失败:', error)
  } finally {
    loading.value = false
  }
}

function performSearch() {
  const query: Record<string, string> = {}
  
  if (searchQuery.value.trim()) {
    query.q = searchQuery.value.trim()
  }
  
  if (selectedCategory.value) {
    query.category = selectedCategory.value.toString()
  }
  
  navigateTo({ path: '/search', query })
}

async function downloadTorrent(torrent: Torrent) {
  if (!user.value) {
    useToast().add({
      title: '请先登录',
      description: '下载种子需要登录账户',
      color: 'warning'
    })
    showAuth.value = true
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
    const response = await downloadTorrentFile(torrent.id)
    if (response.success && response.data && response.data.content) {
      // 创建下载链接
      const blob = new Blob([response.data.content], { type: 'application/x-bittorrent' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${torrent.title}.torrent`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      useToast().add({
        title: '下载成功',
        description: '种子文件已开始下载',
        color: 'success'
      })
    } else {
      throw new Error('下载内容为空')
    }
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

function handleAuthSuccess(userData: User) {
  user.value = userData
  showAuth.value = false
}

// 监听排序变化
watch(sortBy, () => {
  currentPage.value = 1
  loadTorrents()
})

watch(currentPage, () => {
  loadTorrents()
})

// 页面初始化
onMounted(() => {
  loadInitialData()
})
</script>
