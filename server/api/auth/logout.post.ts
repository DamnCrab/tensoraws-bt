defineRouteMeta({
  openAPI: {
    tags: ['Authentication'],
    summary: '用户登出',
    description: '用户退出登录，清除会话',
    responses: {
      200: {
        description: '登出成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    },
    security: [{ sessionAuth: [] }]
  }
})

export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  return { 
    success: true,
    message: '退出登录成功'
  }
})