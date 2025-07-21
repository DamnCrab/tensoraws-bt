export const useComments = () => {
  const { get, post, put, del } = useApi()

  const getComments = (torrentId: number, params?: { page?: number; limit?: number }) => {
    const query = params ? new URLSearchParams(params as any).toString() : ''
    return get(`/torrents/${torrentId}/comments${query ? `?${query}` : ''}`)
  }

  const createComment = (torrentId: number, data: { content: string; parentId?: number }) => {
    return post(`/torrents/${torrentId}/comments`, data)
  }

  const updateComment = (torrentId: number, commentId: number, data: { content: string }) => {
    return put(`/torrents/${torrentId}/comments/${commentId}`, data)
  }

  const deleteComment = (torrentId: number, commentId: number) => {
    return del(`/torrents/${torrentId}/comments/${commentId}`)
  }

  return {
    getComments,
    createComment,
    updateComment,
    deleteComment
  }
}