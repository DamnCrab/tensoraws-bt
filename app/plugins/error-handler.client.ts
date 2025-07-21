/**
 * 全局错误处理插件
 */
export default defineNuxtPlugin(() => {
  // 处理未捕获的错误
  if (process.client) {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      // 这里可以添加错误上报逻辑
    })

    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error)
      // 这里可以添加错误上报逻辑
    })
  }
})