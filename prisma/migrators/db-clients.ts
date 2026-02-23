import { PrismaClient as OldPrismaClient } from '../../generated/prisma-old';
import { PrismaClient as NewPrismaClient } from '../../generated/prisma';

// Client cho database cũ
export const oldDb = new OldPrismaClient({
  datasources: {
    db: {
      url: process.env.OLD_DATABASE_URL,
    },
  },
});

// Client cho database mới
export const newDb = new NewPrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Hàm kết nối
export async function connectDatabases() {
  try {
    await oldDb.$connect();
    console.log('✅ Connected to OLD database');
    
    await newDb.$connect();
    console.log('✅ Connected to NEW database');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Hàm ngắt kết nối
export async function disconnectDatabases() {
  await oldDb.$disconnect();
  await newDb.$disconnect();
  console.log('🔌 Disconnected from both databases');
}
