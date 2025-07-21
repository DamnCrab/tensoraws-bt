<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <!-- 错误图标 -->
      <div class="mb-6">
        <UIcon 
          :name="errorIcon" 
          class="w-16 h-16 mx-auto text-red-500"
        />
      </div>

      <!-- 错误标题 -->
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        {{ errorTitle }}
      </h1>

      <!-- 错误描述 -->
      <p class="text-gray-600 mb-6">
        {{ errorDescription }}
      </p>

      <!-- 操作按钮 -->
      <div class="space-y-3">
        <UButton 
          @click="goHome" 
          class="w-full"
          icon="i-heroicons-home"
        >
          返回首页
        </UButton>
        
        <UButton 
          @click="goBack" 
          variant="outline" 
          class="w-full"
          icon="i-heroicons-arrow-left"
        >
          返回上一页
        </UButton>
        
        <UButton 
          @click="refresh" 
          variant="ghost" 
          class="w-full"
          icon="i-heroicons-arrow-path"
        >
          刷新页面
        </UButton>
      </div>

      <!-- 错误详情（开发模式） -->
      <div v-if="isDev && error" class="mt-8 p-4 bg-gray-100 rounded-lg text-left">
        <h3 class="font-semibold text-gray-900 mb-2">错误详情：</h3>
        <pre class="text-xs text-gray-700 overflow-auto">{{ error }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 页面元数据
definePageMeta({
  layout: false
})

// 获取错误信息
const error = useError()
const isDev = process.dev

// 计算属性
const errorCode = computed(() => {
  if (!error.value) return 500
  return error.value.statusCode || 500
})

const errorIcon = computed(() => {
  switch (errorCode.value) {
    case 404:
      return 'i-heroicons-magnifying-glass'
    case 403:
      return 'i-heroicons-lock-closed'
    case 500:
    default:
      return 'i-heroicons-exclamation-triangle'
  }
})

const errorTitle = computed(() => {
  switch (errorCode.value) {
    case 404:
      return '页面未找到'
    case 403:
      return '访问被拒绝'
    case 500:
      return '服务器错误'
    default:
      return '出现错误'
  }
})

const errorDescription = computed(() => {
  switch (errorCode.value) {
    case 404:
      return '抱歉，您访问的页面不存在或已被删除。'
    case 403:
      return '您没有权限访问此页面。'
    case 500:
      return '服务器遇到了一个错误，请稍后再试。'
    default:
      return error.value?.message || '发生了未知错误，请稍后再试。'
  }
})

// 方法
function goHome() {
  clearError({ redirect: '/' })
}

function goBack() {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    goHome()
  }
}

function refresh() {
  window.location.reload()
}

// 设置页面标题
useHead({
  title: `${errorCode.value} - ${errorTitle.value}`
})
</script>