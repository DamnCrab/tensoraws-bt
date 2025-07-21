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
            <h1 class="text-xl font-semibold">上传种子</h1>
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
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div v-if="!user" class="text-center py-12">
        <UIcon name="i-heroicons-user-circle" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 mb-2">请先登录</h2>
        <p class="text-gray-600 mb-4">您需要登录后才能上传种子</p>
        <UButton to="/auth/login">立即登录</UButton>
      </div>

      <div v-else>
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">上传新种子</h2>
          </template>

          <UForm 
            :state="uploadFormState.formData.value" 
            :errors="uploadFormState.errors.value"
            @submit="handleUpload" 
            class="space-y-6"
          >
            <!-- 种子文件上传 -->
            <UFormField label="种子文件" name="torrentFile" required>
              <div class="space-y-2">
                <input
                  ref="fileInput"
                  type="file"
                  accept=".torrent"
                  @change="handleFileSelect"
                  class="hidden"
                />
                <div
                  @click="fileInput?.click()"
                  @drop="handleFileDrop"
                  @dragover.prevent
                  @dragenter.prevent
                  class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  :class="{ 'border-blue-400 bg-blue-50': isDragging }"
                >
                  <UIcon name="i-heroicons-cloud-arrow-up" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p class="text-gray-600 mb-2">
                    {{ selectedFile ? selectedFile.name : '点击选择或拖拽种子文件到此处' }}
                  </p>
                  <p class="text-sm text-gray-500">支持 .torrent 格式文件</p>
                </div>
                
                <div v-if="torrentInfo" class="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-2">种子信息预览</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-gray-600">文件名:</span>
                      <span class="ml-2 font-medium">{{ torrentInfo.name }}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">文件大小:</span>
                      <span class="ml-2 font-medium">{{ formatFileSize(torrentInfo.size) }}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">文件数量:</span>
                      <span class="ml-2 font-medium">{{ torrentInfo.fileCount }} 个</span>
                    </div>
                    <div>
                      <span class="text-gray-600">Info Hash:</span>
                      <span class="ml-2 font-mono text-xs">{{ torrentInfo.infoHash }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </UFormField>

            <!-- 基本信息 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UFormField label="种子标题" name="title" required>
                <UInput
                  :model-value="uploadFormState.formData.value.title"
                  @update:model-value="uploadFormState.updateField('title', $event)"
                  placeholder="请输入种子标题"
                />
              </UFormField>

              <UFormField label="分类" name="categoryId" required>
                <USelect
                  :model-value="uploadFormState.formData.value.categoryId"
                  @update:model-value="uploadFormState.updateField('categoryId', $event)"
                  :options="categoryOptions"
                  placeholder="选择分类"
                />
              </UFormField>
            </div>

            <UFormField label="发布组" name="publishGroupId">
              <USelect
                :model-value="uploadFormState.formData.value.publishGroupId"
                @update:model-value="uploadFormState.updateField('publishGroupId', $event)"
                :options="publishGroupOptions"
                placeholder="选择发布组（可选）"
              />
            </UFormField>

            <!-- 种子描述 -->
            <UFormField label="种子描述" name="description">
              <UTextarea
                :model-value="uploadFormState.formData.value.description"
                @update:model-value="uploadFormState.updateField('description', $event)"
                placeholder="请输入种子描述，支持 Markdown 格式"
                :rows="8"
              />
              <template #help>
                <div class="text-sm text-gray-500">
                  支持 Markdown 格式。可以包含动漫信息、剧情简介、制作信息等。
                </div>
              </template>
            </UFormField>

            <!-- 标签 -->
            <UFormField label="标签" name="tags">
              <div class="space-y-2">
                <UInput
                  v-model="newTag"
                  placeholder="输入标签后按回车添加"
                  @keyup.enter="addTag"
                />
                <div v-if="uploadFormState.formData.value.tags && uploadFormState.formData.value.tags.length > 0" class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="(tag, index) in uploadFormState.formData.value.tags"
                    :key="index"
                    variant="soft"
                    class="cursor-pointer"
                    @click="removeTag(index)"
                  >
                    {{ tag }}
                    <UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1" />
                  </UBadge>
                </div>
              </div>
            </UFormField>

            <!-- 封面图片 -->
            <UFormField label="封面图片" name="coverImage">
              <div class="space-y-2">
                <input
                  ref="imageInput"
                  type="file"
                  accept="image/*"
                  @change="handleImageSelect"
                  class="hidden"
                />
                <div
                  @click="imageInput?.click()"
                  class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <div v-if="coverImagePreview" class="mb-4">
                    <img :src="coverImagePreview" alt="封面预览" class="max-w-xs mx-auto rounded-lg" />
                  </div>
                  <UIcon name="i-heroicons-photo" class="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p class="text-gray-600">{{ selectedImage ? selectedImage.name : '点击选择封面图片（可选）' }}</p>
                </div>
              </div>
            </UFormField>

            <!-- 高级选项 -->
            <UCard>
              <template #header>
                <div class="flex items-center">
                  <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 mr-2" />
                  <span class="font-medium">高级选项</span>
                </div>
              </template>

              <div class="space-y-4">
                <div class="flex items-center space-x-3">
                  <UCheckbox 
                    :model-value="uploadFormState.formData.value.isPrivate"
                    @update:model-value="uploadFormState.updateField('isPrivate', $event)"
                  />
                  <div>
                    <label class="font-medium text-gray-900">私有种子</label>
                    <p class="text-sm text-gray-600">仅限本站用户下载</p>
                  </div>
                </div>

                <div class="flex items-center space-x-3">
                  <UCheckbox 
                    :model-value="uploadFormState.formData.value.allowComments"
                    @update:model-value="uploadFormState.updateField('allowComments', $event)"
                  />
                  <div>
                    <label class="font-medium text-gray-900">允许评论</label>
                    <p class="text-sm text-gray-600">用户可以对此种子发表评论</p>
                  </div>
                </div>

                <div class="flex items-center space-x-3">
                  <UCheckbox 
                    :model-value="uploadFormState.formData.value.autoApprove"
                    @update:model-value="uploadFormState.updateField('autoApprove', $event)"
                    :disabled="!canAutoApprove" 
                  />
                  <div>
                    <label class="font-medium text-gray-900">自动审核</label>
                    <p class="text-sm text-gray-600">
                      {{ canAutoApprove ? '种子将自动通过审核' : '需要管理员审核后才能下载' }}
                    </p>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- 提交按钮 -->
            <div class="flex justify-end gap-4">
              <UButton @click="$router.back()" variant="outline">取消</UButton>
              <UButton 
                type="submit" 
                :loading="uploadFormState.isSubmitting.value" 
                :disabled="!selectedFile || !uploadFormState.isValid.value"
              >
                <UIcon name="i-heroicons-cloud-arrow-up" class="w-4 h-4 mr-2" />
                上传种子
              </UButton>
            </div>
          </UForm>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User, Category, PublishGroup, ApiResponse, Torrent } from '~/types'
import { authApi, torrentApi, categoryApi, publishGroupApi, uploadApi } from '~/utils/api'
import { formatFileSize } from '~/utils'
import { TorrentUploadSchema } from '../../../shared/schemas'
import { useFormState } from '~/composables/useValidation'

// 页面元数据
definePageMeta({
  title: '上传种子',
  middleware: 'auth'
})

// 响应式数据
const user = ref<User | null>(null)
const categories = ref<Category[]>([])
const publishGroups = ref<PublishGroup[]>([])

const isDragging = ref(false)
const selectedFile = ref<File | null>(null)
const selectedImage = ref<File | null>(null)
const coverImagePreview = ref<string | null>(null)
const newTag = ref('')

// DOM refs
const fileInput = ref<HTMLInputElement>()
const imageInput = ref<HTMLInputElement>()

const torrentInfo = ref<{
  name: string
  size: number
  fileCount: number
  infoHash: string
} | null>(null)

// 表单状态管理
const uploadFormState = useFormState(TorrentUploadSchema, {
  title: '',
  description: '',
  categoryId: 0,
  publishGroupId: undefined,
  tags: [],
  isPrivate: false,
  allowComments: true,
  autoApprove: false
})

// 计算属性
const canAutoApprove = computed(() => {
  return user.value?.role === 'admin' || user.value?.role === 'super_admin'
})

const categoryOptions = computed(() =>
  categories.value
    .filter(cat => cat.isActive)
    .map(cat => ({ label: cat.name, value: cat.id }))
)

const publishGroupOptions = computed(() => [
  { label: '无发布组', value: undefined },
  ...publishGroups.value
    .filter(group => group.isActive)
    .map(group => ({ label: group.name, value: group.id }))
])

const userMenuItems = computed(() => [
  [{
    label: '个人中心',
    icon: 'i-heroicons-user',
    click: () => navigateTo('/profile')
  }],
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
async function loadInitialData() {
  try {
    const [userResponse, categoriesResponse, groupsResponse] = await Promise.all([
      authApi.getProfile(),
      categoryApi.getCategories(),
      publishGroupApi.getPublishGroups()
    ])

    if (userResponse.success && userResponse.data) {
      user.value = userResponse.data
    }

    if (categoriesResponse.success && categoriesResponse.data) {
      categories.value = categoriesResponse.data
    }

    if (groupsResponse.success && groupsResponse.data) {
      publishGroups.value = groupsResponse.data
    }
  } catch (error) {
    console.error('加载初始数据失败:', error)
    useToast().add({
      title: '加载失败',
      description: '无法加载页面数据',
      color: 'error'
    })
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectTorrentFile(target.files[0])
  }
}

function handleFileDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    selectTorrentFile(event.dataTransfer.files[0])
  }
}

async function selectTorrentFile(file: File) {
  if (!file.name.endsWith('.torrent')) {
    useToast().add({
      title: '文件格式错误',
      description: '请选择 .torrent 格式的文件',
      color: 'error'
    })
    return
  }

  selectedFile.value = file
  
  // 解析种子文件信息
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await $fetch<ApiResponse<{
      title?: string
      name?: string
      size: number
      fileCount: number
      infoHash: string
    }>>('/api/torrents/parse', {
      method: 'POST' as const,
      body: formData
    })
    
    if (response.success && response.data) {
      torrentInfo.value = {
        name: response.data.title || response.data.name || '',
        size: response.data.size,
        fileCount: response.data.fileCount,
        infoHash: response.data.infoHash
      }
      uploadFormState.updateField('title', torrentInfo.value.name)
    }
  } catch (error) {
    console.error('解析种子文件失败:', error)
    useToast().add({
      title: '解析失败',
      description: '无法解析种子文件',
      color: 'error'
    })
  }
}

function handleImageSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedImage.value = target.files[0]
    
    // 生成预览
    const reader = new FileReader()
    reader.onload = (e) => {
      coverImagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(target.files[0])
  }
}

function addTag() {
  const tag = newTag.value.trim()
  const currentTags = uploadFormState.formData.value.tags || []
  if (tag && !currentTags.includes(tag)) {
    uploadFormState.updateField('tags', [...currentTags, tag])
    newTag.value = ''
  }
}

function removeTag(index: number) {
  const currentTags = uploadFormState.formData.value.tags || []
  const newTags = currentTags.filter((_: string, i: number) => i !== index)
  uploadFormState.updateField('tags', newTags)
}

async function handleUpload() {
  if (!selectedFile.value) {
    useToast().add({
      title: '上传失败',
      description: '请选择种子文件',
      color: 'error'
    })
    return
  }

  // 使用 Zod 校验表单数据
  const isValid = await uploadFormState.validate()
  if (!isValid) {
    useToast().add({
      title: '表单校验失败',
      description: '请检查并修正表单中的错误',
      color: 'error'
    })
    return
  }

  uploadFormState.setSubmitting(true)
  
  try {
    const formData = uploadFormState.formData.value
    
    // 上传封面图片（如果有）
    let coverImageUrl = null
    if (selectedImage.value) {
      const imageResponse = await uploadApi.uploadFile(selectedImage.value, 'image')
      if (imageResponse.success && imageResponse.data) {
        coverImageUrl = imageResponse.data.url
      }
    }

    // 上传种子
    const uploadFormData = new FormData()
    uploadFormData.append('torrentFile', selectedFile.value)
    uploadFormData.append('title', formData.title || '')
    uploadFormData.append('description', formData.description || '')
    uploadFormData.append('categoryId', (formData.categoryId || 0).toString())
    
    if (formData.publishGroupId) {
      uploadFormData.append('publishGroupId', formData.publishGroupId.toString())
    }
    
    const tags = formData.tags || []
    if (tags.length > 0) {
      uploadFormData.append('tags', JSON.stringify(tags))
    }
    
    if (coverImageUrl) {
      uploadFormData.append('coverImage', coverImageUrl)
    }
    
    uploadFormData.append('isPrivate', (formData.isPrivate || false).toString())
    uploadFormData.append('allowComments', (formData.allowComments || true).toString())
    uploadFormData.append('autoApprove', (formData.autoApprove || false).toString())

    const response = await $fetch<ApiResponse<Torrent>>('/api/torrents/upload', {
      method: 'POST',
      body: uploadFormData
    })
    
    if (response.success && response.data) {
      useToast().add({
        title: '上传成功',
        description: formData.autoApprove ? '种子已上传并自动通过审核' : '种子已上传，等待管理员审核',
        color: 'success'
      })
      
      // 跳转到种子详情页
      await navigateTo(`/torrents/${response.data.id}`)
    }
  } catch (error) {
    console.error('上传种子失败:', error)
    useToast().add({
      title: '上传失败',
      description: '上传种子时发生错误',
      color: 'error'
    })
  } finally {
    uploadFormState.setSubmitting(false)
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
  loadInitialData()
})

// 拖拽事件处理
onMounted(() => {
  const handleDragEnter = () => { isDragging.value = true }
  const handleDragLeave = () => { isDragging.value = false }
  
  document.addEventListener('dragenter', handleDragEnter)
  document.addEventListener('dragleave', handleDragLeave)
  
  onUnmounted(() => {
    document.removeEventListener('dragenter', handleDragEnter)
    document.removeEventListener('dragleave', handleDragLeave)
  })
})
</script>