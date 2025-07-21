<template>
  <div class="torrent-card bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4">
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <!-- 标题和状态 -->
        <div class="flex items-center gap-2 mb-2">
          <NuxtLink
            :to="`/torrents/${torrent.id}`"
            class="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors line-clamp-1"
          >
            {{ torrent.title }}
          </NuxtLink>
          <UBadge :color="getStatusColor(torrent.status)" variant="soft">
            {{ getStatusDisplayName(torrent.status) }}
          </UBadge>
        </div>
        
        <!-- 基本信息 -->
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

        <!-- 统计信息 -->
        <div class="flex items-center gap-6 text-sm mb-2">
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
        <div v-if="torrent.tags && torrent.tags.length > 0" class="flex flex-wrap gap-1 mb-2">
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
        <p v-if="torrent.description && showDescription" class="text-gray-600 text-sm line-clamp-2">
          {{ truncateText(torrent.description, 200) }}
        </p>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-col gap-2 ml-4">
        <UButton
          @click="$emit('download', torrent)"
          :disabled="torrent.status !== 'approved'"
          icon="i-heroicons-arrow-down-tray"
          size="sm"
        >
          下载
        </UButton>
        <UButton
          @click="$emit('view', torrent.id)"
          variant="outline"
          icon="i-heroicons-eye"
          size="sm"
        >
          详情
        </UButton>
        <UButton
          v-if="showEditButton && canEdit"
          @click="$emit('edit', torrent.id)"
          variant="outline"
          icon="i-heroicons-pencil"
          size="sm"
        >
          编辑
        </UButton>
        <UButton
          v-if="showDeleteButton && canDelete"
          @click="$emit('delete', torrent.id)"
          color="error"
          variant="outline"
          icon="i-heroicons-trash"
          size="sm"
        >
          删除
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Torrent, User } from '~/types'
import { formatFileSize, formatDate, truncateText, getStatusColor, getStatusDisplayName } from '~/utils'

interface Props {
  torrent: Torrent
  user?: User | null
  showDescription?: boolean
  showEditButton?: boolean
  showDeleteButton?: boolean
}

interface Emits {
  download: [torrent: Torrent]
  view: [id: number]
  edit: [id: number]
  delete: [id: number]
}

const props = withDefaults(defineProps<Props>(), {
  showDescription: true,
  showEditButton: false,
  showDeleteButton: false
})

defineEmits<Emits>()

// 计算属性
const canEdit = computed(() => {
  if (!props.user) return false
  
  // 管理员可以编辑所有种子
  if (props.user.role === 'admin' || props.user.role === 'super_admin') {
    return true
  }
  
  // 用户只能编辑自己上传的种子
  return props.torrent.publisherId === props.user.id
})

const canDelete = computed(() => {
  if (!props.user) return false
  
  // 管理员可以删除所有种子
  if (props.user.role === 'admin' || props.user.role === 'super_admin') {
    return true
  }
  
  // 用户只能删除自己上传的种子
  return props.torrent.publisherId === props.user.id
})
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>