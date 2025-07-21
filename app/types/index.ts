export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string;
  avatar?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface UserStats {
  uploadedTorrents: number;
  downloadedTorrents: number;
  uploadedBytes: number;
  downloadedBytes: number;
  shareRatio: number;
}

export interface Torrent {
  id: number;
  title: string;
  description: string;
  status: string;
  publisherId?: number;
  categoryId?: number;
  publishGroupId?: number;
  category?: {
    id: number;
    name: string;
  };
  size: number;
  fileCount: number;
  createdAt: string;
  updatedAt?: string;
  seeders: number;
  leechers: number;
  downloads: number;
  publisher?: {
    id: number;
    username: string;
  };
  publishGroup?: {
    id: number;
    name: string;
  };
  tags: string[];
  infoHash?: string;
  coverImage?: string;
  isPrivate?: boolean;
  allowComments?: boolean;
}

export interface TorrentFile {
  id?: number;
  path: string;
  size: number;
}

export interface TorrentUpdateRequest {
  title?: string;
  description?: string;
  categoryId?: number;
  publishGroupId?: number;
  tags?: string[];
  coverImage?: string;
  isPrivate?: boolean;
  allowComments?: boolean;
  autoApprove?: boolean;
}

export interface DownloadResponse {
  url?: string;
  filename?: string;
  content?: ArrayBuffer | Uint8Array;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  sortOrder?: number;
  isActive: boolean;
}

export interface PublishGroup {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

export interface TorrentSearchParams {
  q?: string;
  category?: string;
  publishGroup?: string;
  userId?: number;
  tags?: string;
  sort?: 'newest' | 'oldest' | 'seeders' | 'leechers' | 'downloads' | 'size' | 'title';
  order?: 'asc' | 'desc';
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  minSize?: number;
  maxSize?: number;
  sizeUnit?: 'B' | 'KB' | 'MB' | 'GB' | 'TB';
  timeRange?: 'all' | 'today' | 'week' | 'month' | 'year';
  minSeeders?: number;
  maxSeeders?: number;
  minLeechers?: number;
  maxLeechers?: number;
  page?: number;
  limit?: number;
}

export interface DownloadHistory {
  id: number;
  downloadedAt: string;
  torrent?: {
    title: string;
    size: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
}

export interface AdminStats {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  totalTorrents: number;
  newTorrents: number;
  pendingTorrents: number;
  todayDownloads: number;
  totalDownloads: number;
  totalUpload: string;
  totalDownload: string;
}

export interface Activity {
  id: number;
  type: string;
  message: string;
  description?: string;
  createdAt: string;
  user?: {
    username: string;
  };
}

// 添加缺失的接口
export interface TorrentStats {
  totalTorrents: number;
  activeTorrents: number;
  totalSeeders: number;
  totalLeechers: number;
  totalDownloads: number;
}

export interface Comment {
  id: number;
  content: string;
  userId: number;
  torrentId: number;
  user?: {
    id: number;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TorrentUploadRequest {
  title: string;
  description?: string;
  categoryId: number;
  publishGroupId?: number;
  tags?: string[];
  torrentFile: File;
  coverImage?: File;
  isPrivate?: boolean;
  allowComments?: boolean;
}