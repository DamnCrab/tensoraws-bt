import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { users, categories } from '../database/schema'

export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Run database seed task to populate initial data'
  },
  async run() {
    console.log('Running DB seed task...')
    
    try {
      const db = useDrizzle()
      
      // 检查是否已经有用户数据
      const existingUsers = await db.select().from(users).limit(1)
      if (existingUsers.length > 0) {
        console.log('Database already seeded, skipping...')
        return { result: 'skipped', message: 'Database already contains data' }
      }
      
      // 创建测试用户
      const hashedPassword = await bcrypt.hash('password123', 10)
      
      const seedUsers = [
        {
          username: 'admin',
          email: 'admin@animebt.com',
          password: hashedPassword,
          role: 'admin' as const,
          isActive: true,
          avatar: 'https://example.com/avatar/john.png',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          username: 'testuser',
          email: 'test@animebt.com',
          password: hashedPassword,
          role: 'user' as const,
          isActive: true,
          avatar: 'https://example.com/avatar/jane.png',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      // 插入用户数据
      await db.insert(users).values(seedUsers)
      console.log('✅ Test users created successfully')
      
      // 创建测试分类
      const seedCategories = [
        {
          name: '动画',
          slug: 'anime',
          description: '动画作品',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: '漫画',
          slug: 'manga',
          description: '漫画作品',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: '游戏',
          slug: 'game',
          description: '游戏相关',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: '音乐',
          slug: 'music',
          description: '音乐作品',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      // 插入分类数据
      await db.insert(categories).values(seedCategories)
      console.log('✅ Test categories created successfully')
      
      console.log('🎉 Database seed completed successfully!')
      console.log('📝 Test accounts:')
      console.log('   Admin - Username: admin, Password: password123')
      console.log('   User - Username: testuser, Password: password123')
      
      return { 
        result: 'success', 
        message: 'Database seeded with test users and categories',
        users: seedUsers.length,
        categories: seedCategories.length
      }
      
    } catch (error) {
      console.error('❌ Error seeding database:', error)
      return { 
        result: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
})