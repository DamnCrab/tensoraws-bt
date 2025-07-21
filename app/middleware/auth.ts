export default defineNuxtRouteMiddleware(async (to, from) => {
  const { getProfile } = useAuth()
  
  try {
    const response = await getProfile()
    if (!response.success || !response.data) {
      return navigateTo('/login')
    }
  } catch (error) {
    return navigateTo('/login')
  }
})