export const useAdmin = () => {
  const { get, post, put, upload } = useApi()

  const getSystemStats = () => {
    return get('/admin/stats')
  }

  const getSystemLogs = (params?: { page?: number; limit?: number; level?: string }) => {
    const query = params ? new URLSearchParams(params as any).toString() : ''
    return get(`/admin/logs${query ? `?${query}` : ''}`)
  }

  const getSystemSettings = () => {
    return get('/admin/settings')
  }

  const updateSystemSettings = (settings: Record<string, any>) => {
    return put('/admin/settings', settings)
  }

  const clearCache = () => {
    return post('/admin/cache/clear')
  }

  const backupDatabase = () => {
    return post('/admin/backup')
  }

  const restoreDatabase = (file: File) => {
    const formData = new FormData()
    formData.append('backup', file)
    return upload('/admin/restore', formData)
  }

  return {
    getSystemStats,
    getSystemLogs,
    getSystemSettings,
    updateSystemSettings,
    clearCache,
    backupDatabase,
    restoreDatabase
  }
}