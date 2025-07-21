export default defineNuxtRouteMiddleware(async (to, from) => {
  const { getProfile } = useAuth()
  
  try {
    const response = await getProfile()
    if (!response.success || !response.data) {
      return navigateTo('/')
    }
    
    if (response.data.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: '权限不足'
      })
    }
  } catch (error) {
    return navigateTo('/')
  }
})