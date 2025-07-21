<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 全局导航栏 -->
    <header class="bg-white shadow-sm border-b sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo和导航 -->
          <div class="flex items-center space-x-8">
            <NuxtLink to="/" class="text-xl font-bold text-blue-600 hover:text-blue-800 transition-colors">
              AnimeBT
            </NuxtLink>
            
            <nav class="hidden md:flex space-x-6">
              <NuxtLink 
                to="/" 
                class="text-gray-700 hover:text-blue-600 transition-colors"
                active-class="text-blue-600 font-medium"
              >
                首页
              </NuxtLink>
              <NuxtLink 
                to="/search" 
                class="text-gray-700 hover:text-blue-600 transition-colors"
                active-class="text-blue-600 font-medium"
              >
                搜索
              </NuxtLink>
              <NuxtLink 
                v-if="user" 
                to="/torrents/upload" 
                class="text-gray-700 hover:text-blue-600 transition-colors"
                active-class="text-blue-600 font-medium"
              >
                上传
              </NuxtLink>
            </nav>
          </div>

          <!-- 用户菜单 -->
          <div class="flex items-center space-x-4">
            <!-- 搜索框（小屏幕隐藏） -->
            <div class="hidden lg:block">
              <UInput
                v-model="quickSearch"
                placeholder="快速搜索..."
                icon="i-heroicons-magnifying-glass-20-solid"
                size="sm"
                @keyup.enter="performQuickSearch"
                class="w-64"
              />
            </div>

            <!-- 用户菜单 -->
            <div v-if="user" class="flex items-center space-x-2">
              <!-- 通知 -->
              <UButton 
                variant="ghost" 
                icon="i-heroicons-bell" 
                :badge="unreadNotifications"
                @click="showNotifications = true"
              />
              
              <!-- 用户下拉菜单 -->
              <UDropdownMenu :items="userMenuItems">
                <UButton 
                  variant="ghost" 
                  :label="user.username" 
                  trailing-icon="i-heroicons-chevron-down-20-solid"
                  :avatar="{ src: user.avatar }"
                />
              </UDropdownMenu>
            </div>
            
            <!-- 未登录状态 -->
            <div v-else class="flex space-x-2">
              <UButton @click="showAuth = true" variant="outline" size="sm">
                登录
              </UButton>
              <UButton @click="showAuth = true; authMode = 'register'" size="sm">
                注册
              </UButton>
            </div>

            <!-- 移动端菜单按钮 -->
            <UButton 
              @click="showMobileMenu = true"
              variant="ghost" 
              icon="i-heroicons-bars-3"
              class="md:hidden"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- 主要内容 -->
    <main>
      <slot />
    </main>

    <!-- 页脚 -->
    <footer class="bg-white border-t mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- 网站信息 -->
          <div class="col-span-1 md:col-span-2">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">AnimeBT</h3>
            <p class="text-gray-600 mb-4">
              专业的动漫资源分享平台，为动漫爱好者提供高质量的种子资源。
            </p>
            <div class="flex space-x-4">
              <UButton variant="ghost" icon="i-heroicons-envelope" size="sm">
                联系我们
              </UButton>
              <UButton variant="ghost" icon="i-heroicons-chat-bubble-left-right" size="sm">
                意见反馈
              </UButton>
            </div>
          </div>

          <!-- 快速链接 -->
          <div>
            <h4 class="font-semibold text-gray-900 mb-4">快速链接</h4>
            <ul class="space-y-2 text-sm text-gray-600">
              <li><NuxtLink to="/" class="hover:text-blue-600">首页</NuxtLink></li>
              <li><NuxtLink to="/search" class="hover:text-blue-600">搜索种子</NuxtLink></li>
              <li><NuxtLink to="/torrents/upload" class="hover:text-blue-600">上传种子</NuxtLink></li>
              <li><NuxtLink to="/profile" class="hover:text-blue-600">个人中心</NuxtLink></li>
            </ul>
          </div>

          <!-- 帮助信息 -->
          <div>
            <h4 class="font-semibold text-gray-900 mb-4">帮助</h4>
            <ul class="space-y-2 text-sm text-gray-600">
              <li><a href="#" class="hover:text-blue-600">使用指南</a></li>
              <li><a href="#" class="hover:text-blue-600">常见问题</a></li>
              <li><a href="#" class="hover:text-blue-600">规则说明</a></li>
              <li><a href="#" class="hover:text-blue-600">隐私政策</a></li>
            </ul>
          </div>
        </div>

        <div class="border-t pt-8 mt-8 text-center text-sm text-gray-500">
          <p>&copy; 2024 AnimeBT. All rights reserved.</p>
        </div>
      </div>
    </footer>

    <!-- 认证模态框 -->
    <AuthModal 
      v-model="showAuth" 
      :default-mode="authMode"
      @success="handleAuthSuccess"
    />

    <!-- 移动端菜单 -->
    <USlideover v-model="showMobileMenu" side="right">
      <div class="p-4">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-lg font-semibold">菜单</h2>
          <UButton @click="showMobileMenu = false" variant="ghost" icon="i-heroicons-x-mark" />
        </div>

        <nav class="space-y-4">
          <NuxtLink 
            to="/" 
            class="block py-2 text-gray-700 hover:text-blue-600"
            @click="showMobileMenu = false"
          >
            首页
          </NuxtLink>
          <NuxtLink 
            to="/search" 
            class="block py-2 text-gray-700 hover:text-blue-600"
            @click="showMobileMenu = false"
          >
            搜索
          </NuxtLink>
          <NuxtLink 
            v-if="user" 
            to="/torrents/upload" 
            class="block py-2 text-gray-700 hover:text-blue-600"
            @click="showMobileMenu = false"
          >
            上传种子
          </NuxtLink>
          <NuxtLink 
            v-if="user" 
            to="/profile" 
            class="block py-2 text-gray-700 hover:text-blue-600"
            @click="showMobileMenu = false"
          >
            个人中心
          </NuxtLink>
          <NuxtLink 
            v-if="user && (user.role === 'admin' || user.role === 'super_admin')" 
            to="/admin" 
            class="block py-2 text-gray-700 hover:text-blue-600"
            @click="showMobileMenu = false"
          >
            管理后台
          </NuxtLink>
        </nav>

        <div v-if="!user" class="mt-6 space-y-2">
          <UButton @click="showAuth = true; showMobileMenu = false" class="w-full">
            登录
          </UButton>
          <UButton @click="showAuth = true; authMode = 'register'; showMobileMenu = false" variant="outline" class="w-full">
            注册
          </UButton>
        </div>

        <div v-else class="mt-6">
          <UButton @click="handleLogout" color="error" variant="outline" class="w-full">
            退出登录
          </UButton>
        </div>
      </div>
    </USlideover>

    <!-- 通知面板 -->
    <USlideover v-model="showNotifications" side="right">
      <div class="p-4">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-lg font-semibold">通知</h2>
          <UButton @click="showNotifications = false" variant="ghost" icon="i-heroicons-x-mark" />
        </div>

        <div class="space-y-4">
          <div v-if="notifications.length === 0" class="text-center py-8 text-gray-500">
            暂无通知
          </div>
          
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            class="p-3 border rounded-lg hover:bg-gray-50"
          >
            <h4 class="font-medium text-gray-900">{{ notification.title }}</h4>
            <p class="text-sm text-gray-600 mt-1">{{ notification.content }}</p>
            <p class="text-xs text-gray-400 mt-2">{{ formatDate(notification.createdAt) }}</p>
          </div>
        </div>
      </div>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import type { User } from '~/types'
import { formatDate } from '~/utils'

// 使用 composables
const { getProfile, logout } = useAuth()

// 响应式数据
const user = ref<User | null>(null)
const showAuth = ref(false)
const authMode = ref<'login' | 'register'>('login')
const showMobileMenu = ref(false)
const showNotifications = ref(false)
const quickSearch = ref('')

// 模拟通知数据
const notifications = ref([
  {
    id: 1,
    title: '欢迎使用 AnimeBT',
    content: '感谢您注册 AnimeBT，开始您的动漫之旅吧！',
    createdAt: new Date().toISOString()
  }
])

const unreadNotifications = computed(() => notifications.value.length)

// 计算属性
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
async function loadUser() {
  try {
    const response = await getProfile()
    if (response.success && response.data) {
      user.value = response.data
    }
  } catch (error) {
    // 用户未登录，忽略错误
  }
}

function handleAuthSuccess(userData: User) {
  user.value = userData
  showAuth.value = false
}

async function handleLogout() {
  try {
    await logout()
    user.value = null
    showMobileMenu.value = false
    
    useToast().add({
      title: '退出成功',
      description: '您已成功退出登录',
      color: 'success'
    })
    
    // 如果在需要登录的页面，重定向到首页
    const route = useRoute()
    if (route.meta.middleware === 'auth' || route.meta.middleware === 'admin') {
      await navigateTo('/')
    }
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

function performQuickSearch() {
  if (quickSearch.value.trim()) {
    navigateTo(`/search?q=${encodeURIComponent(quickSearch.value.trim())}`)
    quickSearch.value = ''
  }
}

// 页面初始化
onMounted(() => {
  loadUser()
})
</script>