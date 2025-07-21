export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  return { 
    success: true,
    message: '退出登录成功'
  }
})