import bcrypt from 'bcryptjs'
import { eq, or } from 'drizzle-orm'
import { useDrizzle, schema } from '../../database'
import { validateBody } from '../../utils/validation'
import { createError } from 'h3'
import { LoginRequestSchema } from '../../../shared/schemas'

defineRouteMeta({
  openAPI: {
    tags: ['Authentication'],
    summary: '用户登录',
    description: '用户使用用户名/邮箱和密码登录系统',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['username', 'password'],
            properties: {
              username: { 
                type: 'string', 
                description: '用户名或邮箱地址',
                example: 'admin'
              },
              password: { 
                type: 'string', 
                description: '密码',
                example: 'password123'
              }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: '登录成功',
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
      401: { description: '用户名或密码错误，或账户已被禁用' },
      400: { description: '请求参数错误' }
    }
  }
})

export default defineEventHandler(async (event) => {
  // 使用 Zod 校验请求体
  const { username, password } = await validateBody(event, LoginRequestSchema)

  const db = useDrizzle()

  // 查找用户（支持用户名或邮箱登录）
  const [user] = await db.select()
    .from(schema.users)
    .where(
      or(
        eq(schema.users.username, username),
        eq(schema.users.email, username)
      )
    )
    .limit(1)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '用户名或密码错误'
    })
  }

  // 验证密码
  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      message: '用户名或密码错误'
    })
  }

  if (!user.isActive) {
    throw createError({
      statusCode: 401,
      message: '账户已被禁用'
    })
  }

  // 设置会话
  await setUserSession(event, {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  })

  return {
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }
})