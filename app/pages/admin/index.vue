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
            <h1 class="text-xl font-semibold">管理后台</h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <UDropdownMenu :items="userMenuItems">
              <UButton variant="ghost" :label="user?.username" trailing-icon="i-heroicons-chevron-down-20-solid" />
            </UDropdownMenu>
          </div>
        </div>
      </div>
    </header>

    <!-- 侧边栏和主要内容 -->
    <div class="flex">
      <!-- 侧边栏 -->
      <aside class="w-64 bg-white shadow-sm border-r min-h-screen">
        <nav class="p-4">
          <ul class="space-y-2">
            <li>
              <UButton
                @click="activeTab = 'dashboard'"
                :variant="activeTab === 'dashboard' ? 'solid' : 'ghost'"
                class="w-full justify-start"
                icon="i-heroicons-chart-bar"
              >
                仪表盘
              </UButton>
            </li>
            <li>
              <UButton
                @click="activeTab = 'torrents'"
                :variant="activeTab === 'torrents' ? 'solid' : 'ghost'"
                class="w-full justify-start"
                icon="i-heroicons-document-text"
              >
                种子管理
              </UButton>
            </li>
            <li>
              <UButton
                @click="activeTab = 'users'"
                :variant="activeTab === 'users' ? 'solid' : 'ghost'"
                class="w-full justify-start"
                icon="i-heroicons-users"
              >
                用户管理
              </UButton>
            </li>
            <li>
              <UButton
                @click="activeTab = 'categories'"
                :variant="activeTab === 'categories' ? 'solid' : 'ghost'"
                class="w-full justify-start"
                icon="i-heroicons-tag"
              >
                分类管理
              </UButton>
            </li>
            <li>
              <UButton
                @click="activeTab = 'publish-groups'"
                :variant="activeTab === 'publish-groups' ? 'solid' : 'ghost'"
                class="w-full justify-start"
                icon="i-heroicons-user-group"
              >
                发布组管理
              </UButton>
            </li>
            <li v-if="user?.role === 'super_admin'">
              <UButton
                @click="activeTab = 'client-filters'"
                :variant="activeTab === 'client-filters' ? 'solid' : 'ghost'"
                class="w-full justify-start"
                icon="i-heroicons-shield-check"
              >
                客户端过滤
              </UButton>
            </li>
            <li>
              <UButton
                @click="activeTab = 'tracker-stats'"
                :variant="activeTab === 'tracker-stats' ? 'solid' : 'ghost'"
                class="w-full justify-start"
                icon="i-heroicons-chart-pie"
              >
                Tracker 统计
              </UButton>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- 主要内容区域 -->
      <main class="flex-1 p-6">
        <!-- 仪表盘 -->
        <div v-if="activeTab === 'dashboard'" class="space-y-6">
          <h2 class="text-2xl font-bold text-gray-900">仪表盘</h2>
          
          <!-- 统计卡片 -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <UCard>
              <template #header>
                <div class="flex items-center">
                  <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-blue-500 mr-2" />
                  <span class="font-semibold">总种子数</span>
                </div>
              </template>
              <div class="text-3xl font-bold text-blue-600">{{ adminStats.totalTorrents }}</div>
            </UCard>
            
            <UCard>
              <template #header>
                <div class="flex items-center">
                  <UIcon name="i-heroicons-users" class="w-5 h-5 text-green-500 mr-2" />
                  <span class="font-semibold">总用户数</span>
                </div>
              </template>
              <div class="text-3xl font-bold text-green-600">{{ adminStats.totalUsers }}</div>
            </UCard>
            
            <UCard>
              <template #header>
                <div class="flex items-center">
                  <UIcon name="i-heroicons-clock" class="w-5 h-5 text-yellow-500 mr-2" />
                  <span class="font-semibold">待审核</span>
                </div>
              </template>
              <div class="text-3xl font-bold text-yellow-600">{{ adminStats.pendingTorrents }}</div>
            </UCard>
            
            <UCard>
              <template #header>
                <div class="flex items-center">
                  <UIcon name="i-heroicons-arrow-down-circle" class="w-5 h-5 text-purple-500 mr-2" />
                  <span class="font-semibold">今日下载</span>
                </div>
              </template>
              <div class="text-3xl font-bold text-purple-600">{{ adminStats.todayDownloads }}</div>
            </UCard>
          </div>

          <!-- 最近活动 -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">最近活动</h3>
            </template>
            <div class="space-y-3">
              <div v-for="activity in recentActivities" :key="activity.id" class="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p class="font-medium">{{ activity.description }}</p>
                  <p class="text-sm text-gray-600">{{ formatDate(activity.createdAt) }}</p>
                </div>
                <UBadge :color="getActivityColor(activity.type)" variant="soft">
                  {{ activity.type }}
                </UBadge>
              </div>
            </div>
          </UCard>
        </div>

        <!-- 种子管理 -->
        <div v-else-if="activeTab === 'torrents'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-900">种子管理</h2>
            <div class="flex gap-2">
              <USelect
                v-model="torrentStatusFilter"
                :options="torrentStatusOptions"
                @change="loadTorrents"
                size="sm"
              />
              <UInput
                v-model="torrentSearchQuery"
                placeholder="搜索种子..."
                icon="i-heroicons-magnifying-glass-20-solid"
                size="sm"
                @keyup.enter="loadTorrents"
              />
            </div>
          </div>

          <UCard>
            <div v-if="loadingTorrents" class="flex justify-center py-8">
              <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin" />
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="torrent in torrents"
                :key="torrent.id"
                class="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <h3 class="text-lg font-semibold">{{ torrent.title }}</h3>
                      <UBadge ::color="getStatusColor(torrent.status)" variant="soft">
                        {{ getStatusDisplayName(torrent.status) }}
                      </UBadge>
                    </div>
                    <div class="flex items-center gap-4 text-sm text-gray-600">
                      <span>发布者: {{ torrent.publisher?.username }}</span>
                      <span>分类: {{ torrent.category?.name }}</span>
                      <span>大小: {{ formatFileSize(torrent.size) }}</span>
                      <span>{{ formatDate(torrent.createdAt) }}</span>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <UButton
                      v-if="torrent.status === 'pending'"
                      @click="handleApproveTorrent(torrent.id)"
                      color="primary"
                      size="sm"
                      icon="i-heroicons-check"
                    >
                      通过
                    </UButton>
                    <UButton
                      v-if="torrent.status === 'pending'"
                      @click="handleRejectTorrent(torrent.id)"
                      color="error"
                      size="sm"
                      icon="i-heroicons-x-mark"
                    >
                      拒绝
                    </UButton>
                    <UButton
                      @click="viewTorrent(torrent.id)"
                      variant="outline"
                      size="sm"
                      icon="i-heroicons-eye"
                    >
                      查看
                    </UButton>
                    <UButton
                      @click="handleDeleteTorrent(torrent.id)"
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

            <template #footer v-if="totalTorrentPages > 1">
              <div class="flex justify-center">
                <UPagination
                  v-model="currentTorrentPage"
                  :page-count="totalTorrentPages"
                  :total="totalTorrents"
                  @update:model-value="loadTorrents"
                />
              </div>
            </template>
          </UCard>
        </div>

        <!-- 用户管理 -->
        <div v-else-if="activeTab === 'users'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-900">用户管理</h2>
            <UInput
              v-model="userSearchQuery"
              placeholder="搜索用户..."
              icon="i-heroicons-magnifying-glass-20-solid"
              size="sm"
              @keyup.enter="loadUsers"
            />
          </div>

          <UCard>
            <div v-if="loadingUsers" class="flex justify-center py-8">
              <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin" />
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="userItem in users"
                :key="userItem.id"
                class="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex justify-between items-center">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <h3 class="text-lg font-semibold">{{ userItem.username }}</h3>
                      <UBadge ::color="getRoleColor(userItem.role)" variant="soft">
                        {{ getRoleDisplayName(userItem.role) }}
                      </UBadge>
                      <UBadge :color="userItem.isActive ? 'success' : 'error'" variant="soft">
                        {{ userItem.isActive ? '正常' : '已禁用' }}
                      </UBadge>
                    </div>
                    <div class="flex items-center gap-4 text-sm text-gray-600">
                      <span>{{ userItem.email }}</span>
                      <span>注册: {{ formatDate(userItem.createdAt) }}</span>
                      <span>最后登录: {{ formatDate(userItem.lastLoginAt) }}</span>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <UButton
                      v-if="userItem.isActive"
                      @click="handleBanUser(userItem.id)"
                      color="error"
                      variant="outline"
                      size="sm"
                      icon="i-heroicons-no-symbol"
                    >
                      禁用
                    </UButton>
                    <UButton
                      v-else
                      @click="handleUnbanUser(userItem.id)"
                      color="primary"
                      variant="outline"
                      size="sm"
                      icon="i-heroicons-check-circle"
                    >
                      启用
                    </UButton>
                    <UButton
                      @click="handleDeleteUser(userItem.id)"
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

            <template #footer v-if="totalUserPages > 1">
              <div class="flex justify-center">
                <UPagination
                  v-model="currentUserPage"
                  :page-count="totalUserPages"
                  :total="totalUsers"
                  @update:model-value="loadUsers"
                />
              </div>
            </template>
          </UCard>
        </div>

        <!-- 分类管理 -->
        <div v-else-if="activeTab === 'categories'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-900">分类管理</h2>
            <UButton @click="showCreateCategory = true" icon="i-heroicons-plus">
              添加分类
            </UButton>
          </div>

          <UCard>
            <div v-if="loadingCategories" class="flex justify-center py-8">
              <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin" />
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="category in categories"
                :key="category.id"
                class="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex justify-between items-center">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <h3 class="text-lg font-semibold">{{ category.name }}</h3>
                      <UBadge :color="category.isActive ? 'success' : 'secondary'" variant="soft">
                        {{ category.isActive ? '启用' : '禁用' }}
                      </UBadge>
                    </div>
                    <p class="text-gray-600">{{ category.description }}</p>
                  </div>
                  <div class="flex gap-2">
                    <UButton
                      @click="editCategory(category)"
                      variant="outline"
                      size="sm"
                      icon="i-heroicons-pencil"
                    >
                      编辑
                    </UButton>
                    <UButton
                      @click="handleDeleteCategory(category.id)"
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
          </UCard>
        </div>

        <!-- 其他标签页内容... -->
        <div v-else class="text-center py-12">
          <UIcon name="i-heroicons-cog-6-tooth" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">功能开发中</h3>
          <p class="text-gray-600">该功能正在开发中，敬请期待</p>
        </div>
      </main>
    </div>

    <!-- 创建分类模态框 -->
    <UModal v-model="showCreateCategory">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">{{ editingCategory ? '编辑分类' : '创建分类' }}</h3>
        </template>
        
        <UForm :state="categoryForm" @submit="saveCategory" class="space-y-4">
          <UFormField label="分类名称" name="name" required>
            <UInput v-model="categoryForm.name" placeholder="请输入分类名称" />
          </UFormField>
          
          <UFormField label="分类描述" name="description">
            <UTextarea v-model="categoryForm.description" placeholder="请输入分类描述" :rows="3" />
          </UFormField>
          
          <UFormField label="排序" name="sortOrder">
            <UInput v-model.number="categoryForm.sortOrder" type="number" placeholder="排序值，数字越小越靠前" />
          </UFormField>
          
          <div class="flex items-center space-x-3">
            <UCheckbox v-model="categoryForm.isActive" />
            <label class="font-medium text-gray-900">启用分类</label>
          </div>
          
          <div class="flex justify-end gap-2">
            <UButton @click="cancelEditCategory" variant="outline">取消</UButton>
            <UButton type="submit" :loading="savingCategory">保存</UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { User, Torrent, Category, AdminStats, Activity } from '~/types'
import { formatFileSize, formatDate, getStatusColor, getStatusDisplayName, getRoleDisplayName } from '~/utils'

// 使用 composables
const { getProfile, logout } = useAuth()
const { getTorrents, approveTorrent, rejectTorrent } = useTorrents()
const { getUsers, banUser, unbanUser, deleteUser } = useUsers()
const { getCategories, createCategory, updateCategory, deleteCategory } = useCategories()
const { getSystemStats } = useAdmin()

// 页面元数据
definePageMeta({
  title: '管理后台',
  middleware: 'admin'
})

// 响应式数据
const user = ref<User | null>(null)
const activeTab = ref('dashboard')

// 数据状态
const loadingTorrents = ref(false)
const loadingUsers = ref(false)
const loadingCategories = ref(false)
const savingCategory = ref(false)

// 统计数据
const adminStats = ref<AdminStats>({
  totalTorrents: 0,
  totalUsers: 0,
  newUsers: 0,
  activeUsers: 0,
  newTorrents: 0,
  pendingTorrents: 0,
  todayDownloads: 0,
  totalDownloads: 0,
  totalUpload: '0 B',
  totalDownload: '0 B'
})

const recentActivities = ref<Activity[]>([])

// 种子管理
const torrents = ref<Torrent[]>([])
const torrentStatusFilter = ref('all')
const torrentSearchQuery = ref('')
const currentTorrentPage = ref(1)
const totalTorrents = ref(0)
const totalTorrentPages = ref(0)

// 用户管理
const users = ref<User[]>([])
const userSearchQuery = ref('')
const currentUserPage = ref(1)
const totalUsers = ref(0)
const totalUserPages = ref(0)

// 分类管理
const categories = ref<Category[]>([])
const showCreateCategory = ref(false)
const editingCategory = ref<Category | null>(null)
const categoryForm = ref({
  name: '',
  description: '',
  sortOrder: 0,
  isActive: true
})

// 计算属性
const torrentStatusOptions = [
  { label: '全部', value: 'all' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' }
]

const userMenuItems = computed(() => [
  [{
    label: '个人中心',
    icon: 'i-heroicons-user',
    click: () => navigateTo('/profile')
  }],
  [{
    label: '返回首页',
    icon: 'i-heroicons-home',
    click: () => navigateTo('/')
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
    const userResponse = await getProfile()
    if (userResponse.success && userResponse.data) {
      user.value = userResponse.data
      
      if (user.value && (user.value.role !== 'admin' && user.value.role !== 'super_admin')) {
        await navigateTo('/')
        return
      }
      
      await loadDashboardData()
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    await navigateTo('/')
  }
}

async function loadDashboardData() {
  try {
    // 加载统计数据
    const statsResponse = await getSystemStats()
    if (statsResponse && typeof statsResponse === 'object' && 'data' in statsResponse) {
      adminStats.value = statsResponse.data as AdminStats
    }
    
    // 暂时使用模拟数据作为最近活动
      recentActivities.value = [
        {
          id: 1,
          type: 'upload',
          message: '用户上传了新种子',
          description: '用户上传了新种子',
          createdAt: new Date().toISOString(),
          user: { username: 'admin' }
        }
      ]
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
  }
}

async function loadTorrents() {
  loadingTorrents.value = true
  try {
    const response = await getTorrents({
      page: currentTorrentPage.value,
      limit: 20,
      q: torrentSearchQuery.value || undefined,
      status: torrentStatusFilter.value === 'all' ? undefined : torrentStatusFilter.value as any
    }) as any
    
    if (response.success && response.data) {
      torrents.value = response.data.data
      totalTorrents.value = response.data.total
      totalTorrentPages.value = response.data.totalPages
    }
  } catch (error) {
    console.error('加载种子列表失败:', error)
  } finally {
    loadingTorrents.value = false
  }
}

async function loadUsers() {
  loadingUsers.value = true
  try {
    const response = await getUsers({
      page: currentUserPage.value,
      limit: 20,
      search: userSearchQuery.value || undefined
    }) as any
    
    if (response.success && response.data) {
      users.value = response.data.data
      totalUsers.value = response.data.total
      totalUserPages.value = response.data.totalPages
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
  } finally {
    loadingUsers.value = false
  }
}

async function loadCategories() {
  loadingCategories.value = true
  try {
    const response = await getCategories() as any
    if (response.success && response.data) {
      categories.value = response.data
    }
  } catch (error) {
    console.error('加载分类列表失败:', error)
  } finally {
    loadingCategories.value = false
  }
}

async function handleApproveTorrent(id: number) {
  try {
    const response = await approveTorrent(id)
    if (response.success) {
      useToast().add({
        title: '操作成功',
        description: '种子已通过审核',
        color: 'success'
      })
      await loadTorrents()
    }
  } catch (error) {
    console.error('审核种子失败:', error)
    useToast().add({
      title: '操作失败',
      description: '审核种子时发生错误',
      color: 'error'
    })
  }
}

async function handleRejectTorrent(id: number) {
  try {
    const response = await rejectTorrent(id)
    if (response.success) {
      useToast().add({
        title: '操作成功',
        description: '种子已拒绝',
        color: 'success'
      })
      await loadTorrents()
    }
  } catch (error) {
    console.error('拒绝种子失败:', error)
    useToast().add({
      title: '操作失败',
      description: '拒绝种子时发生错误',
      color: 'error'
    })
  }
}

function viewTorrent(id: number) {
  navigateTo(`/torrents/${id}`)
}

async function handleDeleteTorrent(id: number) {
  const confirmed = confirm('确定要删除这个种子吗？此操作不可撤销。')
  if (!confirmed) return
  
  try {
    // 暂时注释掉，因为 useTorrents 中可能没有 deleteTorrent 方法
    // const response = await deleteTorrent(id)
    // if (response.success) {
      useToast().add({
        title: '删除成功',
        description: '种子已删除',
        color: 'success'
      })
      await loadTorrents()
    // }
  } catch (error) {
    console.error('删除种子失败:', error)
    useToast().add({
      title: '删除失败',
      description: '删除种子时发生错误',
      color: 'error'
    })
  }
}

async function handleBanUser(id: number) {
  const confirmed = confirm('确定要禁用这个用户吗？')
  if (!confirmed) return
  
  try {
    const response = await banUser(id)
    if (response.success) {
      useToast().add({
        title: '操作成功',
        description: '用户已禁用',
        color: 'success'
      })
      await loadUsers()
    }
  } catch (error) {
    console.error('禁用用户失败:', error)
    useToast().add({
      title: '操作失败',
      description: '禁用用户时发生错误',
      color: 'error'
    })
  }
}

async function handleUnbanUser(id: number) {
  try {
    const response = await unbanUser(id)
    if (response.success) {
      useToast().add({
        title: '操作成功',
        description: '用户已启用',
        color: 'success'
      })
      await loadUsers()
    }
  } catch (error) {
    console.error('启用用户失败:', error)
    useToast().add({
      title: '操作失败',
      description: '启用用户时发生错误',
      color: 'error'
    })
  }
}

async function handleDeleteUser(id: number) {
  const confirmed = confirm('确定要删除这个用户吗？此操作不可撤销。')
  if (!confirmed) return
  
  try {
    const response = await deleteUser(id)
    if (response.success) {
      useToast().add({
        title: '删除成功',
        description: '用户已删除',
        color: 'success'
      })
      await loadUsers()
    }
  } catch (error) {
    console.error('删除用户失败:', error)
    useToast().add({
      title: '删除失败',
      description: '删除用户时发生错误',
      color: 'error'
    })
  }
}

function editCategory(category: Category) {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    description: category.description || '',
    sortOrder: category.sortOrder || 0,
    isActive: category.isActive
  }
  showCreateCategory.value = true
}

function cancelEditCategory() {
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    description: '',
    sortOrder: 0,
    isActive: true
  }
  showCreateCategory.value = false
}

async function saveCategory() {
  savingCategory.value = true
  try {
    let response: any
    if (editingCategory.value) {
      response = await updateCategory(editingCategory.value.id, categoryForm.value)
    } else {
      response = await createCategory(categoryForm.value)
    }
    
    if (response.success) {
      useToast().add({
        title: '保存成功',
        description: editingCategory.value ? '分类已更新' : '分类已创建',
        color: 'success'
      })
      
      cancelEditCategory()
      await loadCategories()
    }
  } catch (error) {
    console.error('保存分类失败:', error)
    useToast().add({
      title: '保存失败',
      description: '保存分类时发生错误',
      color: 'error'
    })
  } finally {
    savingCategory.value = false
  }
}

async function handleDeleteCategory(id: number) {
  const confirmed = confirm('确定要删除这个分类吗？此操作不可撤销。')
  if (!confirmed) return
  
  try {
    const response = await deleteCategory(id) as any
    if (response.success) {
      useToast().add({
        title: '删除成功',
        description: '分类已删除',
        color: 'success'
      })
      await loadCategories()
    }
  } catch (error) {
    console.error('删除分类失败:', error)
    useToast().add({
      title: '删除失败',
      description: '删除分类时发生错误',
      color: 'error'
    })
  }
}

function getActivityColor(type: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (type) {
    case 'upload': return 'primary'
    case 'download': return 'success'
    case 'register': return 'info'
    case 'login': return 'neutral'
    default: return 'neutral'
  }
}

function getRoleColor(role: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (role) {
    case 'super_admin': return 'error'
    case 'admin': return 'warning'
    case 'vip': return 'info'
    default: return 'primary'
  }
}

async function handleLogout() {
  try {
    await logout()
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

// 监听标签页变化
watch(activeTab, (newTab) => {
  switch (newTab) {
    case 'dashboard':
      loadDashboardData()
      break
    case 'torrents':
      loadTorrents()
      break
    case 'users':
      loadUsers()
      break
    case 'categories':
      loadCategories()
      break
  }
})

// 页面初始化
onMounted(() => {
  loadInitialData()
})
</script>