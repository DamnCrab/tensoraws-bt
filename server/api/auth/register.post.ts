import bcrypt from 'bcryptjs'
import { eq, or } from 'drizzle-orm'
import { useDrizzle, schema } from '../../database'
import { validateBody } from '../../utils/validation'
import { createError } from 'h3'
import { RegisterRequestSchema } from '../../../shared/schemas'

defineRouteMeta({
  openAPI: {
    tags: ['Authentication'],
    summary: '用户注册',
    description: '新用户注册账户',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['username', 'email', 'password'],
            properties: {
              username: { 
                type: 'string', 
                description: '用户名',
                minLength: 3,
                maxLength: 20,
                example: 'newuser'
              },
              email: { 
                type: 'string', 
                format: 'email',
                description: '邮箱地址',
                example: 'user@example.com'
              },
              password: { 
                type: 'string', 
                description: '密码',
                minLength: 6,
                example: 'password123'
              }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: '注册成功',
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
      400: { description: '用户名已存在或邮箱已被注册' },
      500: { description: '用户创建失败' }
    }
  }
})

export default defineEventHandler(async (event) => {
  // 使用 Zod 校验请求体
  const { username, email, password } = await validateBody(event, RegisterRequestSchema)

  const db = useDrizzle()

  // 检查用户是否已存在
  const existingUser = await db.select()
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1)

  if (existingUser.length > 0) {
    throw createError({
      statusCode: 400,
      message: '用户名已存在'
    })
  }

  const existingEmail = await db.select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)

  if (existingEmail.length > 0) {
    throw createError({
      statusCode: 400,
      message: '邮箱已被注册'
    })
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 12)

  // 创建用户
  const [newUser] = await db.insert(schema.users).values({
    username,
    email,
    password: hashedPassword,
    role: 'user'
  }).returning()

  if (!newUser) {
    throw createError({
      statusCode: 500,
      message: '用户创建失败'
    })
  }

  // 设置会话
  await setUserSession(event, {
    user: {
      id: Number(newUser.id),
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    }
  })

  return {
    success: true,
    data: {
      id: Number(newUser.id),
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    }
  }
})