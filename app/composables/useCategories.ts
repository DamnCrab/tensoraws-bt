export const useCategories = () => {
  const { get, post, put, del } = useApi()

  const getCategories = () => {
    return get('/categories')
  }

  const getCategory = (id: number) => {
    return get(`/categories/${id}`)
  }

  const createCategory = (data: any) => {
    return post('/categories', data)
  }

  const updateCategory = (id: number, data: any) => {
    return put(`/categories/${id}`, data)
  }

  const deleteCategory = (id: number) => {
    return del(`/categories/${id}`)
  }

  return {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
  }
}