export const useFileUpload = () => {
  const { upload } = useApi()

  const uploadTorrentFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'torrent')
    return upload('/upload/torrent', formData)
  }

  const uploadImage = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'image')
    return upload('/upload/image', formData)
  }

  const uploadAvatar = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'avatar')
    return upload('/upload/avatar', formData)
  }

  return {
    uploadTorrentFile,
    uploadImage,
    uploadAvatar
  }
}