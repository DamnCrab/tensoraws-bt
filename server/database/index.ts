import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export { schema }

export function useDrizzle() {
  return drizzle(hubDatabase(), { schema })
}

export type User = typeof schema.users.$inferSelect
export type NewUser = typeof schema.users.$inferInsert
export type Torrent = typeof schema.torrents.$inferSelect
export type NewTorrent = typeof schema.torrents.$inferInsert
export type Category = typeof schema.categories.$inferSelect
export type NewCategory = typeof schema.categories.$inferInsert
export type PublishGroup = typeof schema.publishGroups.$inferSelect
export type NewPublishGroup = typeof schema.publishGroups.$inferInsert
export type TorrentFile = typeof schema.torrentFiles.$inferSelect
export type NewTorrentFile = typeof schema.torrentFiles.$inferInsert
export type Comment = typeof schema.comments.$inferSelect
export type NewComment = typeof schema.comments.$inferInsert
export type DownloadHistory = typeof schema.downloadHistory.$inferSelect
export type NewDownloadHistory = typeof schema.downloadHistory.$inferInsert
export type ClientFilter = typeof schema.clientFilters.$inferSelect
export type NewClientFilter = typeof schema.clientFilters.$inferInsert