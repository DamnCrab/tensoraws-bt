export const usePublishGroups = () => {
  const { get, post, put, del } = useApi()

  const getPublishGroups = () => {
    return get('/publish-groups')
  }

  const getPublishGroup = (id: number) => {
    return get(`/publish-groups/${id}`)
  }

  const createPublishGroup = (data: any) => {
    return post('/publish-groups', data)
  }

  const updatePublishGroup = (id: number, data: any) => {
    return put(`/publish-groups/${id}`, data)
  }

  const deletePublishGroup = (id: number) => {
    return del(`/publish-groups/${id}`)
  }

  return {
    getPublishGroups,
    getPublishGroup,
    createPublishGroup,
    updatePublishGroup,
    deletePublishGroup
  }
}