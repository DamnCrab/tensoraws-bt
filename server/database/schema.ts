import { sqliteTable, text, integer, blob, index } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// 用户表
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', { enum: ['super_admin', 'admin', 'publisher', 'user'] }).notNull().default('user'),
  avatar: text('avatar'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true)
}, (table) => ({
  usernameIdx: index('username_idx').on(table.username),
  emailIdx: index('email_idx').on(table.email)
}))

// 发布组表
export const publishGroups = sqliteTable('publish_groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
})

// 用户发布组关联表
export const userPublishGroups = sqliteTable('user_publish_groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  groupId: integer('group_id').notNull().references(() => publishGroups.id, { onDelete: 'cascade' })
}, (table) => ({
  userGroupIdx: index('user_group_idx').on(table.userId, table.groupId)
}))

// 分类表
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  color: text('color').default('#3b82f6'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
})

// 种子表
export const torrents = sqliteTable('torrents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  infoHash: text('info_hash').notNull().unique(),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  publisherId: integer('publisher_id').notNull().references(() => users.id),
  publishGroupId: integer('publish_group_id').references(() => publishGroups.id),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  r2Key: text('r2_key'), // R2 存储路径
  size: integer('size').notNull(), // 总大小
  fileCount: integer('file_count').notNull(),
  seeders: integer('seeders').notNull().default(0),
  leechers: integer('leechers').notNull().default(0),
  downloads: integer('downloads').notNull().default(0),
  tags: text('tags'), // JSON 字符串存储标签
  coverImage: text('cover_image'), // 封面图片 URL
  isPrivate: integer('is_private', { mode: 'boolean' }).notNull().default(false),
  allowComments: integer('allow_comments', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  approvedBy: integer('approved_by').references(() => users.id)
}, (table) => ({
  infoHashIdx: index('info_hash_idx').on(table.infoHash),
  statusIdx: index('status_idx').on(table.status),
  categoryIdx: index('category_idx').on(table.categoryId),
  publisherIdx: index('publisher_idx').on(table.publisherId)
}))

// 种子文件列表
export const torrentFiles = sqliteTable('torrent_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  torrentId: integer('torrent_id').notNull().references(() => torrents.id, { onDelete: 'cascade' }),
  path: text('path').notNull(),
  size: integer('size').notNull(),
  index: integer('index').notNull()
}, (table) => ({
  torrentIdx: index('torrent_files_torrent_idx').on(table.torrentId)
}))

// Peer 跟踪表
export const peers = sqliteTable('peers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  infoHash: text('info_hash').notNull(),
  peerId: text('peer_id').notNull(),
  ip: text('ip').notNull(),
  port: integer('port').notNull(),
  uploaded: integer('uploaded').notNull().default(0),
  downloaded: integer('downloaded').notNull().default(0),
  left: integer('left').notNull(),
  event: text('event', { enum: ['started', 'stopped', 'completed', 'empty'] }),
  lastAnnounce: integer('last_announce', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
  infoHashIdx: index('peers_info_hash_idx').on(table.infoHash),
  peerIdx: index('peers_peer_idx').on(table.peerId, table.infoHash)
}))

// 客户端过滤规则表
export const clientFilters = sqliteTable('client_filters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', { enum: ['client_regex', 'ip_range', 'ip_blacklist'] }).notNull(),
  pattern: text('pattern').notNull(), // 正则表达式或IP范围
  action: text('action', { enum: ['allow', 'deny'] }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, table => ({
  typeIdx: index('client_filters_type_idx').on(table.type),
  activeIdx: index('client_filters_active_idx').on(table.isActive)
}))

// 评论表
export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  torrentId: integer('torrent_id').notNull().references(() => torrents.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
  torrentIdx: index('comments_torrent_idx').on(table.torrentId),
  userIdx: index('comments_user_idx').on(table.userId)
}))

// 下载历史表
export const downloadHistory = sqliteTable('download_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  torrentId: integer('torrent_id').notNull().references(() => torrents.id, { onDelete: 'cascade' }),
  downloadedAt: integer('downloaded_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
  userIdx: index('download_history_user_idx').on(table.userId),
  torrentIdx: index('download_history_torrent_idx').on(table.torrentId)
}))

// 关系定义
export const usersRelations = relations(users, ({ many }) => ({
  torrents: many(torrents),
  userPublishGroups: many(userPublishGroups),
  comments: many(comments),
  downloadHistory: many(downloadHistory)
}))

export const publishGroupsRelations = relations(publishGroups, ({ many }) => ({
  userPublishGroups: many(userPublishGroups),
  torrents: many(torrents)
}))

export const userPublishGroupsRelations = relations(userPublishGroups, ({ one }) => ({
  user: one(users, {
    fields: [userPublishGroups.userId],
    references: [users.id]
  }),
  group: one(publishGroups, {
    fields: [userPublishGroups.groupId],
    references: [publishGroups.id]
  })
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  torrents: many(torrents)
}))

export const torrentsRelations = relations(torrents, ({ one, many }) => ({
  category: one(categories, {
    fields: [torrents.categoryId],
    references: [categories.id]
  }),
  publisher: one(users, {
    fields: [torrents.publisherId],
    references: [users.id]
  }),
  publishGroup: one(publishGroups, {
    fields: [torrents.publishGroupId],
    references: [publishGroups.id]
  }),
  approver: one(users, {
    fields: [torrents.approvedBy],
    references: [users.id]
  }),
  files: many(torrentFiles),
  comments: many(comments),
  downloadHistory: many(downloadHistory)
}))

export const torrentFilesRelations = relations(torrentFiles, ({ one }) => ({
  torrent: one(torrents, {
    fields: [torrentFiles.torrentId],
    references: [torrents.id]
  })
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  torrent: one(torrents, {
    fields: [comments.torrentId],
    references: [torrents.id]
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id]
  })
}))

export const downloadHistoryRelations = relations(downloadHistory, ({ one }) => ({
  user: one(users, {
    fields: [downloadHistory.userId],
    references: [users.id]
  }),
  torrent: one(torrents, {
    fields: [downloadHistory.torrentId],
    references: [torrents.id]
  })
}))