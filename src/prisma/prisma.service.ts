import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['error', 'warn'], // Chỉ log errors và warnings
      errorFormat: 'pretty',
    })

    // Connect to database on service initialization
    this.$connect()
      .then(() => {
        console.log('✅ Database connected successfully')
      })
      .catch((error) => {
        console.error('❌ Database connection failed:', error)
        process.exit(1)
      })
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
