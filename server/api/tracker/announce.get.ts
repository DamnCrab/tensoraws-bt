import { eq, and, gte, lt } from 'drizzle-orm'
import { useDrizzle, schema } from '../../database'
import { getRequestIP, createError } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Tracker'],
    summary: 'BitTorrent Tracker Announce',
    description: 'BitTorrent 协议的 announce 端点，用于 peer 发现和统计',
    parameters: [
      {
        name: 'info_hash',
        in: 'query',
        required: true,
        description: '种子的 info hash',
        schema: { type: 'string' }
      },
      {
        name: 'peer_id',
        in: 'query',
        required: true,
        description: '客户端的 peer ID',
        schema: { type: 'string' }
      },
      {
        name: 'port',
        in: 'query',
        required: true,
        description: '客户端监听端口',
        schema: { type: 'integer', minimum: 1, maximum: 65535 }
      },
      {
        name: 'uploaded',
        in: 'query',
        description: '已上传字节数',
        schema: { type: 'string', default: '0' }
      },
      {
        name: 'downloaded',
        in: 'query',
        description: '已下载字节数',
        schema: { type: 'string', default: '0' }
      },
      {
        name: 'left',
        in: 'query',
        required: true,
        description: '剩余下载字节数',
        schema: { type: 'string' }
      },
      {
        name: 'event',
        in: 'query',
        description: '事件类型',
        schema: { 
          type: 'string', 
          enum: ['started', 'completed', 'stopped', 'empty'],
          default: 'empty'
        }
      },
      {
        name: 'compact',
        in: 'query',
        description: '是否使用紧凑格式',
        schema: { type: 'string', default: '1' }
      },
      {
        name: 'numwant',
        in: 'query',
        description: '期望返回的 peer 数量',
        schema: { type: 'string', default: '50' }
      }
    ],
    responses: {
      200: {
        description: 'Announce 成功',
        content: {
          'text/plain': {
            schema: {
              type: 'object',
              properties: {
                interval: { 
                  type: 'integer',
                  description: 'announce 间隔（秒）'
                },
                'min interval': { 
                  type: 'integer',
                  description: '最小 announce 间隔（秒）'
                },
                complete: { 
                  type: 'integer',
                  description: 'seeders 数量'
                },
                incomplete: { 
                  type: 'integer',
                  description: 'leechers 数量'
                },
                peers: {
                  type: 'array',
                  description: 'peer 列表',
                  items: {
                    type: 'object',
                    properties: {
                      'peer id': { type: 'string' },
                      ip: { type: 'string' },
                      port: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      400: { description: '缺少必需参数' },
      403: { description: '客户端不被允许' },
      404: { description: '种子不存在' }
    }
  }
})

// 客户端过滤函数
async function checkClientFilter(peerId: string, ip: string, userAgent?: string): Promise<boolean> {
  const db = useDrizzle()
  
  // 获取活跃的过滤规则
  const filters = await db.select()
    .from(schema.clientFilters)
    .where(eq(schema.clientFilters.isActive, true))

  for (const filter of filters) {
    let matches = false
    
    switch (filter.type) {
      case 'client_regex':
        // 检查客户端标识
        const clientRegex = new RegExp(filter.pattern, 'i')
        matches = clientRegex.test(peerId) || (userAgent ? clientRegex.test(userAgent) : false)
        break
        
      case 'ip_range':
        // 检查IP范围 (简单实现，支持CIDR格式)
        matches = isIpInRange(ip, filter.pattern)
        break
        
      case 'ip_blacklist':
        // 检查IP黑名单
        matches = ip === filter.pattern || ip.startsWith(filter.pattern)
        break
    }
    
    if (matches) {
      return filter.action === 'allow'
    }
  }
  
  // 默认允许
  return true
}

// 简单的IP范围检查函数
function isIpInRange(ip: string, range: string): boolean {
  if (range.includes('/')) {
    // CIDR格式
    const [network, prefixLengthStr] = range.split('/')
    if (!network || !prefixLengthStr) return false;
    const prefixLength = parseInt(prefixLengthStr!)
    if (isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32) return false;
    const networkParts = network!.split('.').map(Number)
    const ipParts = ip.split('.').map(Number)
    if (networkParts.length !== 4 || ipParts.length !== 4) return false;
    if (networkParts.some(isNaN) || ipParts.some(isNaN)) return false;
    
    const networkInt = (networkParts[0]! << 24) + (networkParts[1]! << 16) + (networkParts[2]! << 8) + networkParts[3]!
    const ipInt = (ipParts[0]! << 24) + (ipParts[1]! << 16) + (ipParts[2]! << 8) + ipParts[3]!
    const mask = (-1 << (32 - prefixLength)) >>> 0
    
    return (networkInt & mask) === (ipInt & mask)
  } else {
    // 直接IP匹配
    return ip === range
  }
}

interface TrackerStats {
  announces: number
  completed: number
  lastUpdate: number
}

// 更新KV中的统计信息
async function updateTrackerStats(infoHash: string, event: string) {
  const kv = hubKV()
  const key = `tracker:stats:${infoHash}`
  
  try {
    const stats: TrackerStats = (await kv.get<TrackerStats>(key, { type: 'json' })) ?? { 
      announces: 0, 
      completed: 0, 
      lastUpdate: Date.now() 
    }
    
    stats.announces++
    if (event === 'completed') {
      stats.completed++
    }
    stats.lastUpdate = Date.now()
    
    await kv.set(key, stats, { ttl: 86400 * 7 }) // 7天过期
  } catch (error) {
    console.error('Failed to update tracker stats:', error)
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  const {
    info_hash,
    peer_id,
    port,
    uploaded = '0',
    downloaded = '0',
    left,
    event: announceEvent = 'empty',
    compact = '1',
    numwant = '50'
  } = query

  // 验证必需参数
  if (!info_hash || !peer_id || !port || left === undefined) {
    throw createError({
      statusCode: 400,
      message: 'Missing required parameters'
    })
  }

  const clientIp = getRequestIP(event) ?? '127.0.0.1'
  const userAgent = getHeader(event, 'user-agent')

  // 客户端过滤检查
  const isAllowed = await checkClientFilter(peer_id as string, clientIp, userAgent)
  if (!isAllowed) {
    throw createError({
      statusCode: 403,
      message: 'Client not allowed'
    })
  }

  const db = useDrizzle()
  
  // 验证种子是否存在且已审核
  const [torrent] = await db.select()
    .from(schema.torrents)
    .where(and(
      eq(schema.torrents.infoHash, info_hash as string),
      eq(schema.torrents.status, 'approved')
    ))
    .limit(1)

  if (!torrent) {
    throw createError({
      statusCode: 404,
      message: 'Torrent not found'
    })
  }

  const now = new Date()
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

  // 更新或插入 peer 信息
  const existingPeer = await db.select()
    .from(schema.peers)
    .where(and(
      eq(schema.peers.infoHash, info_hash as string),
      eq(schema.peers.peerId, peer_id as string)
    ))
    .limit(1)

  if (existingPeer.length > 0) {
    // 更新现有 peer
    await db.update(schema.peers)
      .set({
        ip: clientIp,
        port: parseInt(port as string),
        uploaded: parseInt(uploaded as string),
        downloaded: parseInt(downloaded as string),
        left: parseInt(left as string),
        event: announceEvent as any,
        lastAnnounce: now
      })
      .where(and(
        eq(schema.peers.infoHash, info_hash as string),
        eq(schema.peers.peerId, peer_id as string)
      ))
  } else {
    // 插入新 peer
    await db.insert(schema.peers).values({
      infoHash: info_hash as string,
      peerId: peer_id as string,
      ip: clientIp,
      port: parseInt(port as string),
      uploaded: parseInt(uploaded as string),
      downloaded: parseInt(downloaded as string),
      left: parseInt(left as string),
      event: announceEvent as any,
      lastAnnounce: now
    })
  }

  // 清理过期的 peers (超过5分钟未更新)
  await db.delete(schema.peers)
    .where(and(
      eq(schema.peers.infoHash, info_hash as string),
      lt(schema.peers.lastAnnounce, fiveMinutesAgo)
    ))

  // 获取活跃的 peers
  const activePeers = await db.select()
    .from(schema.peers)
    .where(and(
      eq(schema.peers.infoHash, info_hash as string),
      gte(schema.peers.lastAnnounce, fiveMinutesAgo)
    ))
    .limit(parseInt(numwant as string))

  // 统计 seeders 和 leechers
  const seeders = activePeers.filter(p => p.left === 0).length
  const leechers = activePeers.filter(p => p.left > 0).length

  // 更新种子统计信息
  await db.update(schema.torrents)
    .set({
      seeders,
      leechers,
      downloads: announceEvent === 'completed' ? torrent.downloads + 1 : torrent.downloads
    })
    .where(eq(schema.torrents.id, torrent.id))

  // 更新KV统计信息
  await updateTrackerStats(info_hash as string, announceEvent as string)

  // 构建响应
  const response = {
    interval: 1800, // 30分钟
    'min interval': 900, // 15分钟
    complete: seeders,
    incomplete: leechers,
    peers: activePeers.map(peer => ({
      'peer id': peer.peerId,
      ip: peer.ip,
      port: peer.port
    }))
  }

  // 设置正确的 Content-Type
  setHeader(event, 'Content-Type', 'text/plain')
  
  return response
})