import { PrismaClient } from '../generated/prisma-old';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.OLD_DATABASE_URL || 'mysql://root:070904@localhost:3307/toan-thay-bee-database',
    },
  },
});

async function main() {
  console.log('🔍 Testing connection to old database...\n');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to old database successfully\n');

    // Count records one by one for better error messages
    console.log('📊 Counting records...\n');
    
    const userCount = await prisma.oldUser.count();
    console.log(`✅ Users:     ${userCount}`);
    
    const questionCount = await prisma.oldQuestion.count();
    console.log(`✅ Questions: ${questionCount}`);
    
    try {
      const examCount = await prisma.oldExam.count();
      console.log(`✅ Exams:     ${examCount}`);
    } catch (e) {
      console.log(`⚠️  Exams: Error - ${e.message}`);
    }
    
    try {
      const classCount = await prisma.oldClass.count();
      console.log(`✅ Classes:   ${classCount}`);
    } catch (e) {
      console.log(`⚠️  Classes: Error - ${e.message}`);
    }
    
    console.log('');

    // Sample data
    console.log('📝 Sample User:');
    const sampleUser = await prisma.oldUser.findFirst({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        userType: true,
        class: true,
      },
    });
    console.log(sampleUser);
    console.log('');

    console.log('✨ Database is ready for migration!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
