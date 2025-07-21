declare module '#auth-utils' {
  interface User {
    id: number
    username: string
    email: string
    role: 'super_admin' | 'admin' | 'publisher' | 'user'
    avatar?: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }

  interface UserSession {
    user: User
  }
}

export {}