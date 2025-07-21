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

    <!-- 编辑表单 -->
    <div v-else-if="torrent" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 返回按钮 -->
      <div class="mb-6">
        <UButton @click="$router.back()" variant="outline" icon="i-heroicons-arrow-left">
          返回
        </UButton>
      </div>

      <UCard>
        <template #header>
          <h1 class="text-2xl font-bold text-gray-900">编辑种子</h1>
        </template>

        <UForm :schema="schema" :state="formData" @submit="updateTorrent" class="space-y-6">
          <!-- 基本信息 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900">基本信息</h3>
            
            <UFormField label="标题" name="title" required>
              <UInput v-model="formData.title" placeholder="输入种子标题" />
            </UFormField>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="分类" name="categoryId" required>
                <USelect
                  v-model="formData.categoryId"
                  :options="categoryOptions"
                  placeholder="选择分类"
                />
              </UFormField>

              <UFormField label="发布组" name="publishGroupId">
                <USelect
                  v-model="formData.publishGroupId"
                  :options="publishGroupOptions"
                  placeholder="选择发布组（可选）"
                />
              </UFormField>
            </div>
          </div>

          <!-- 描述 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900">描述</h3>
            <UFormField label="种子描述" name="description">
              <UTextarea
                v-model="formData.description"
                placeholder="输入种子描述，支持 Markdown 格式"
                :rows="8"
              />
            </UFormField>
          </div>

          <!-- 标签 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900">标签</h3>
            <div class="space-y-3">
              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="(tag, index) in formData.tags"
                  :key="index"
                  variant="soft"
                  color="primary"
                  class="cursor-pointer"
                  @click="removeTag(index)"
                >
                  {{ tag }}
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1" />
                </UBadge>
              </div>
              <div class="flex gap-2">
                <UInput
                  v-model="newTag"
                  placeholder="添加标签"
                  @keyup.enter="addTag"
                  class="flex-1"
                />
                <UButton @click="addTag" variant="outline" :disabled="!newTag.trim()">
                  添加
                </UButton>
              </div>
            </div>
          </div>

          <!-- 封面图片 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900">封面图片</h3>
            <div class="space-y-3">
              <div v-if="formData.coverImage" class="flex items-start gap-4">
                <img
                  :src="formData.coverImage"
                  alt="封面预览"
                  class="w-32 h-32 object-cover rounded-lg"
                />
                <div class="flex-1">
                  <p class="text-sm text-gray-600 mb-2">当前封面图片</p>
                  <UButton @click="removeCoverImage" variant="outline" color="error" size="sm">
                    移除封面
                  </UButton>
                </div>
              </div>
              
              <div class="flex gap-2">
                <UInput
                  ref="coverImageInput"
                  type="file"
                  accept="image/*"
                  @change="handleCoverImageSelect"
                  class="hidden"
                />
                <UButton @click="selectCoverImage" variant="outline" icon="i-heroicons-photo">
                  {{ formData.coverImage ? '更换封面' : '上传封面' }}
                </UButton>
              </div>
            </div>
          </div>

          <!-- 高级选项 -->
          <div v-if="canSetAdvancedOptions" class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900">高级选项</h3>
            <div class="space-y-3">
              <UCheckbox v-model="formData.isPrivate" label="私有种子" />
              <UCheckbox v-model="formData.allowComments" label="允许评论" />
              <UCheckbox v-if="isAdmin" v-model="formData.autoApprove" label="自动审核通过" />
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-end gap-3 pt-6 border-t">
            <UButton @click="$router.back()" variant="outline">
              取消
            </UButton>
            <UButton type="submit" :loading="updating">
              保存更改
            </UButton>
          </div>
        </UForm>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User, Torrent, Category, PublishGroup, TorrentUpdateRequest, ApiResponse } from '~/types'
import { authApi, torrentApi, categoryApi, publishGroupApi } from '~/utils/api'
import { z } from 'zod'

// 页面元数据
definePageMeta({
  title: '编辑种子',
  layout: 'default',
  middleware: 'auth'
})

// 路由参数
const route = useRoute()
const torrentId = parseInt(route.params.id as string)

// 表单验证模式
const schema = z.object({
  title: z.string().min(1, '标题不能为空'),
  categoryId: z.number().min(1, '请选择分类'),
  publishGroupId: z.number().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  coverImage: z.string().optional(),
  isPrivate: z.boolean().optional(),
  allowComments: z.boolean().optional(),
  autoApprove: z.boolean().optional()
})

// 响应式数据
const user = ref<User | null>(null)
const torrent = ref<Torrent | null>(null)
const categories = ref<Category[]>([])
const publishGroups = ref<PublishGroup[]>([])
const loading = ref(true)
const updating = ref(false)
const error = ref<string | null>(null)
const newTag = ref('')
const coverImageInput = ref<HTMLInputElement>()

// 表单数据
const formData = ref<TorrentUpdateRequest>({
  title: '',
  categoryId: 0,
  publishGroupId: undefined,
  description: '',
  tags: [],
  coverImage: '',
  isPrivate: false,
  allowComments: true,
  autoApprove: false
})

// 计算属性
const canEdit = computed(() => {
  if (!user.value || !torrent.value) return false
  return user.value.id === torrent.value.publisherId || 
         user.value.role === 'admin' || 
         user.value.role === 'super_admin'
})

const isAdmin = computed(() => {
  return user.value?.role === 'admin' || user.value?.role === 'super_admin'
})

const canSetAdvancedOptions = computed(() => {
  return user.value?.role === 'admin' || user.value?.role === 'super_admin'
})

const categoryOptions = computed(() => 
  categories.value.map(cat => ({
    label: cat.name,
    value: cat.id
  }))
)

const publishGroupOptions = computed(() => [
  { label: '无', value: undefined },
  ...publishGroups.value.map(group => ({
    label: group.name,
    value: group.id
  }))
])

// 方法
async function loadInitialData() {
  try {
    // 加载用户信息
    const userResponse = await authApi.getProfile()
    if (userResponse.success && userResponse.data) {
      user.value = userResponse.data
    } else {
      throw new Error('用户未登录')
    }

    // 并行加载数据
    await Promise.all([
      loadTorrent(),
      loadCategories(),
      loadPublishGroups()
    ])
  } catch (error) {
    console.error('加载初始数据失败:', error)
    navigateTo('/')
  }
}

async function loadTorrent() {
  try {
    const response = await torrentApi.getTorrent(torrentId)
    if (response.success && response.data) {
      torrent.value = response.data
      
      // 填充表单数据
      formData.value = {
        title: torrent.value.title,
        categoryId: torrent.value.categoryId,
        publishGroupId: torrent.value.publishGroupId,
        description: torrent.value.description || '',
        tags: torrent.value.tags || [],
        coverImage: torrent.value.coverImage || '',
        isPrivate: torrent.value.isPrivate,
        allowComments: torrent.value.allowComments,
        autoApprove: false
      }
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

async function loadCategories() {
  try {
    const response = await categoryApi.getCategories()
    if (response.success && response.data) {
      categories.value = response.data
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

async function loadPublishGroups() {
  try {
    const response = await publishGroupApi.getPublishGroups()
    if (response.success && response.data) {
      publishGroups.value = response.data
    }
  } catch (error) {
    console.error('加载发布组失败:', error)
  }
}

async function updateTorrent() {
  if (!canEdit.value) {
    useToast().add({
      title: '权限不足',
      description: '您没有权限编辑此种子',
      color: 'error'
    })
    return
  }

  updating.value = true
  try {
    const response = await torrentApi.updateTorrent(torrentId, formData.value)
    if (response.success) {
      useToast().add({
        title: '更新成功',
        description: '种子信息已更新',
        color: 'success'
      })
      
      // 返回种子详情页
      navigateTo(`/torrents/${torrentId}`)
    }
  } catch (error) {
    console.error('更新种子失败:', error)
    useToast().add({
      title: '更新失败',
      description: '更新种子时发生错误',
      color: 'error'
    })
  } finally {
    updating.value = false
  }
}

function addTag() {
  const tag = newTag.value.trim()
  if (tag && !formData.value.tags?.includes(tag)) {
    if (!formData.value.tags) {
      formData.value.tags = []
    }
    formData.value.tags.push(tag)
    newTag.value = ''
  }
}

function removeTag(index: number) {
  if (formData.value.tags) {
    formData.value.tags.splice(index, 1)
  }
}

function selectCoverImage() {
  coverImageInput.value?.click()
}

async function handleCoverImageSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    useToast().add({
      title: '文件类型错误',
      description: '请选择图片文件',
      color: 'error'
    })
    return
  }

  // 验证文件大小 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    useToast().add({
      title: '文件过大',
      description: '图片文件大小不能超过 5MB',
      color: 'error'
    })
    return
  }

  try {
    // 上传图片
    const uploadFormData = new FormData()
    uploadFormData.append('image', file)
    
    const response = await $fetch<ApiResponse<{ url: string }>>('/api/upload/image', {
      method: 'POST',
      body: uploadFormData
    })

    if (response.success && response.data) {
      formData.value.coverImage = response.data.url
      
      useToast().add({
        title: '上传成功',
        description: '封面图片已上传',
        color: 'success'
      })
    }
  } catch (error) {
    console.error('上传图片失败:', error)
    useToast().add({
      title: '上传失败',
      description: '上传图片时发生错误',
      color: 'error'
    })
  }
}

function removeCoverImage() {
  formData.value.coverImage = ''
}

// 页面初始化
onMounted(() => {
  loadInitialData()
})

// 权限检查
watch([user, torrent], ([newUser, newTorrent]) => {
  if (newUser && newTorrent && !canEdit.value) {
    useToast().add({
      title: '权限不足',
      description: '您没有权限编辑此种子',
      color: 'error'
    })
    navigateTo(`/torrents/${torrentId}`)
  }
})
</script>