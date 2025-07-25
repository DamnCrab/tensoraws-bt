import parseTorrent from 'parse-torrent'
import { eq } from 'drizzle-orm'
import { useDrizzle, schema } from '../../database'
import { z } from 'zod'
import { createError } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Torrents'],
    summary: '上传种子文件',
    description: '上传新的种子文件，需要发布者权限',
    requestBody: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['torrent', 'title', 'categoryId'],
            properties: {
              torrent: {
                type: 'string',
                format: 'binary',
                description: '种子文件'
              },
              title: {
                type: 'string',
                minLength: 1,
                maxLength: 200,
                description: '种子标题',
                example: '电影名称 (2023) [1080p]'
              },
              description: {
                type: 'string',
                description: '种子描述',
                example: '高清电影资源，包含中英字幕'
              },
              categoryId: {
                type: 'string',
                description: '分类ID',
                example: '1'
              },
              publishGroupId: {
                type: 'string',
                description: '发布组ID（可选）',
                example: '1'
              }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: '上传成功',
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
                    title: { type: 'string' },
                    infoHash: { type: 'string' },
                    status: { type: 'string', enum: ['pending', 'approved'] }
                  }
                }
              }
            }
          }
        }
      },
      400: { 
        description: '请求错误',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                statusCode: { type: 'integer' },
                message: { type: 'string' },
                data: {
                  type: 'object',
                  properties: {
                    errors: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: { type: 'string' },
                          message: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      403: { description: '权限不足' },
      500: { description: '上传失败' }
    },
    security: [{ sessionAuth: [] }]
  }
})

// 定义上传表单数据校验
const TorrentUploadFormSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  description: z.string().optional(),
  categoryId: z.string().transform(val => parseInt(val)).pipe(z.number().positive('分类ID必须是正整数')),
  publishGroupId: z.string().transform(val => parseInt(val)).pipe(z.number().positive()).optional()
})

export default defineEventHandler(async (event) => {
  // 检查用户权限
  const session = await getUserSession(event)
  if (!session?.user || !['publisher', 'admin', 'super_admin'].includes(session.user.role)) {
    throw createError({
      statusCode: 403,
      message: '权限不足'
    })
  }

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({
      statusCode: 400,
      message: '请上传种子文件'
    })
  }

  const torrentFile = formData.find(field => field.name === 'torrent')
  if (!torrentFile) {
    throw createError({
      statusCode: 400,
      message: '种子文件不能为空'
    })
  }

  // 提取表单数据
  const formFields = {
    title: formData.find(field => field.name === 'title')?.data?.toString(),
    description: formData.find(field => field.name === 'description')?.data?.toString(),
    categoryId: formData.find(field => field.name === 'categoryId')?.data?.toString(),
    publishGroupId: formData.find(field => field.name === 'publishGroupId')?.data?.toString()
  }

  // 使用 Zod 校验表单数据
  let validatedData
  try {
    validatedData = TorrentUploadFormSchema.parse(formFields)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Validation Error',
        data: {
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }
      })
    }
    throw error
  }

  try {
    // 解析种子文件
    const torrentData = parseTorrent(torrentFile.data)
    
    if (!torrentData.infoHash) {
      throw createError({
        statusCode: 400,
        message: '无效的种子文件'
      })
    }

    const db = useDrizzle()

    // 检查种子是否已存在
    const existingTorrent = await db.select()
      .from(schema.torrents)
      .where(eq(schema.torrents.infoHash, torrentData.infoHash))
      .limit(1)

    if (existingTorrent.length > 0) {
      throw createError({
        statusCode: 400,
        message: '该种子已存在'
      })
    }

    // 清理种子文件 - 移除内置tracker
    const cleanedTorrent = { ...torrentData } as any
    if (cleanedTorrent.announce) {
      // 替换为我们自己的tracker
      const trackerUrl = `${getRequestURL(event).origin}/api/tracker/announce`
      cleanedTorrent.announce = [trackerUrl]
      cleanedTorrent.announceList = [[trackerUrl]]
    }

    // 重新编码种子文件
    const cleanedTorrentBuffer = parseTorrent.toTorrentFile(cleanedTorrent as any)

    // 上传到R2
    const blob = hubBlob()
    const filename = `torrents/${torrentData.infoHash}.torrent`
    await blob.put(filename, cleanedTorrentBuffer, {
      contentType: 'application/x-bittorrent'
    })

    // 计算文件总大小和数量
    interface TorrentFile {
      path: string | string[]
      length: number
      name?: string
    }
    
    const files: TorrentFile[] = Array.isArray((torrentData as any).files) 
      ? (torrentData as any).files 
      : [{ length: (torrentData as any).length || 0, path: (torrentData as any).name || 'unknown' }]
    
    const totalSize = files.reduce((sum: number, file: TorrentFile) => sum + file.length, 0)
    const fileCount = files.length

    // 保存种子信息到数据库
    const inserted = await db.insert(schema.torrents).values({
      title: validatedData.title,
      description: validatedData.description || '',
      infoHash: torrentData.infoHash,
      categoryId: validatedData.categoryId,
      publisherId: Number(session.user.id),
      publishGroupId: validatedData.publishGroupId || null,
      r2Key: filename,
      size: totalSize,
      fileCount,
      status: session.user.role === 'super_admin' ? 'approved' : 'pending'
    }).returning()

    const newTorrent = inserted[0]
    if (!newTorrent) {
      throw new Error('Failed to insert torrent')
    }

    // 保存文件列表
    if (files.length > 0) {
      const fileRecords = files.map((file: TorrentFile, index: number) => ({
        torrentId: newTorrent.id,
        path: Array.isArray(file.path) ? file.path.join('/') : file.path || file.name || '',
        size: file.length,
        index
      }))

      await db.insert(schema.torrentFiles).values(fileRecords)
    }

    return {
      success: true,
      data: {
        id: newTorrent.id,
        title: newTorrent.title,
        infoHash: newTorrent.infoHash,
        status: newTorrent.status
      }
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : '上传失败'
    })
  }
})