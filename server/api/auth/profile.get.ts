export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    
    if (!session || !session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: '未登录'
      })
    }

    return {
      success: true,
      data: session.user
    }
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: '获取用户信息失败'
    })
  }
})