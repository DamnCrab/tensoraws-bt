import { createError } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Authentication'],
    summary: '获取用户资料',
    description: '获取当前登录用户的资料信息',
    responses: {
      200: {
        description: '获取成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    username: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string', enum: ['user', 'admin', 'super_admin'] },
                    avatar: { type: 'string', nullable: true },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      },
      401: { description: '未登录或获取用户信息失败' }
    },
    security: [{ sessionAuth: [] }]
  }
})

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    
    if (!session || !session.user) {
      throw createError({
        statusCode: 401,
        message: '未登录'
      })
    }

    return {
      success: true,
      data: session.user
    }
  } catch (error) {
    throw createError({
      statusCode: 401,
      message: '获取用户信息失败'
    })
  }
})