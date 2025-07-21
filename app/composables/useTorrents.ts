import type { 
  ApiResponse, 
  PaginatedResponse, 
  TorrentSearchParams,
  Torrent,
  TorrentFile,
  TorrentUpdateRequest,
  DownloadResponse
} from '~/types'

/**
 * 种子相关的 composable
 */
export const useTorrents = () => {
  const { get, post, put, del, upload } = useApi()
  const getTorrents = async (params: TorrentSearchParams = {}): Promise<ApiResponse<PaginatedResponse<Torrent>>> => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })
  
  const query = searchParams.toString()
  return get(`/torrents${query ? `?${query}` : ''}`)
}
  
  const getTorrent = async (id: number): Promise<ApiResponse<Torrent>> => {
  return get(`/torrents/${id}`)
}
  
  const getTorrentFiles = async (id: number): Promise<ApiResponse<TorrentFile[]>> => {
  return get(`/torrents/${id}/files`)
}
  
  const uploadTorrent = async (formData: FormData): Promise<ApiResponse<Torrent>> => {
  return upload('/torrents/upload', formData)
}
  
  const updateTorrent = async (id: number, data: TorrentUpdateRequest): Promise<ApiResponse<Torrent>> => {
  return put(`/torrents/${id}`, data)
}
  
  const deleteTorrent = async (id: number): Promise<ApiResponse<void>> => {
  return del(`/torrents/${id}`)
}
  
  const downloadTorrent = async (id: number): Promise<ApiResponse<DownloadResponse>> => {
  return get(`/torrents/${id}/download`)
}
  
  const approveTorrent = async (id: number): Promise<ApiResponse<Torrent>> => {
  return post(`/torrents/${id}/approve`)
}
  
  const rejectTorrent = async (id: number, reason?: string): Promise<ApiResponse<Torrent>> => {
  return post(`/torrents/${id}/reject`, { reason })
}

  return {
    getTorrents,
    getTorrent,
    getTorrentFiles,
    uploadTorrent,
    updateTorrent,
    deleteTorrent,
    downloadTorrent,
    approveTorrent,
    rejectTorrent
  }
}