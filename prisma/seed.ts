import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Tạo roles với hierarchy
    console.log('📝 Seeding roles...');
    const superAdminRole = await prisma.role.upsert({
        where: { roleName: 'SUPER_ADMIN' },
        update: {},
        create: {
            roleName: 'SUPER_ADMIN',
            description: 'Super Administrator - có thể cấp mọi role',
            isAssignable: false,
            requiredByRoleId: null, // Không cần role nào
        },
    });

    const adminRole = await prisma.role.upsert({
        where: { roleName: 'ADMIN' },
        update: {},
        create: {
            roleName: 'ADMIN',
            description: 'System Administrator',
            isAssignable: true,
            requiredByRoleId: superAdminRole.roleId, // Chỉ SUPER_ADMIN mới cấp được
        },
    });

    const permissionsUserRole = await prisma.role.upsert({
        where: { roleName: 'PERMISSIONS_USER' },
        update: {},
        create: {
            roleName: 'PERMISSIONS_USER',
            description: 'User có thể quản lý quyền của người dùng khác',
            isAssignable: true,
            requiredByRoleId: adminRole.roleId, // Chỉ ADMIN mới cấp được
        },
    });

    const teacherRole = await prisma.role.upsert({
        where: { roleName: 'TEACHER' },
        update: {},
        create: {
            roleName: 'TEACHER',
            description: 'Teacher/Instructor',
            isAssignable: true,
            requiredByRoleId: permissionsUserRole.roleId, // Phải có quyền cấp role mới cấp được
        },
    });

    const studentRole = await prisma.role.upsert({
        where: { roleName: 'STUDENT' },
        update: {},
        create: {
            roleName: 'STUDENT',
            description: 'Student',
            isAssignable: true,
            requiredByRoleId: permissionsUserRole.roleId, // Phải có quyền cấp role mới cấp được
        },
    });

    console.log(`✅ Roles created: ${superAdminRole.roleName}, ${adminRole.roleName}, ${teacherRole.roleName}, ${studentRole.roleName}`);

    // 2. Tạo admin users
    console.log('👤 Seeding admin users...');
    const hashedPassword = await bcrypt.hash('070904', 10);

    const superAdminUser = await prisma.user.upsert({
        where: { username: 'minhduc7904' },
        update: {},
        create: {
            username: 'minhduc7904',
            email: 'nmduc7904@gmail.com',
            passwordHash: hashedPassword,
            firstName: 'Đức',
            lastName: 'Nguyễn Minh',
        },
    });

    const adminUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@bee.edu.vn',
            passwordHash: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
        },
    });

    // 3. Tạo admin records
    const superAdmin = await prisma.admin.upsert({
        where: { userId: superAdminUser.userId },
        update: {},
        create: {
            userId: superAdminUser.userId,
        },
    });

    const adminRecord = await prisma.admin.upsert({
        where: { userId: adminUser.userId },
        update: {},
        create: {
            userId: adminUser.userId,
        },
    });

    // 4. Gán roles cho admins bằng UserRole
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: superAdminUser.userId,
                roleId: superAdminRole.roleId,
            },
        },
        update: {},
        create: {
            userId: superAdminUser.userId,
            roleId: superAdminRole.roleId,
            assignedBy: null, // Tự cấp
            expiresAt: null, // Vĩnh viễn
        },
    });

    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.userId,
                roleId: adminRole.roleId,
            },
        },
        update: {},
        create: {
            userId: adminUser.userId,
            roleId: adminRole.roleId,
            assignedBy: superAdminUser.userId, // Được SUPER_ADMIN cấp
            expiresAt: null, // Vĩnh viễn
        },
    });

    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.userId,
                roleId: permissionsUserRole.roleId,
            },
        },
        update: {},
        create: {
            userId: adminUser.userId,
            roleId: permissionsUserRole.roleId,
            assignedBy: superAdminUser.userId, // Được SUPER_ADMIN cấp thêm role PERMISSIONS_USER
            expiresAt: null,
        },
    });

    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.userId,
                roleId: teacherRole.roleId,
            },
        },
        update: {},
        create: {
            userId: adminUser.userId,
            roleId: teacherRole.roleId,
            assignedBy: superAdminUser.userId, // Được SUPER_ADMIN cấp thêm role TEACHER
            expiresAt: null,
        },
    });

    console.log(`✅ Admin users created: ${superAdminUser.username}, ${adminUser.username}`);

    // 5. Tạo student users
    console.log('👨‍🎓 Seeding student users...');
    const studentPassword = await bcrypt.hash('student123', 10);

    const studentUser1 = await prisma.user.upsert({
        where: { username: 'student1' },
        update: {},
        create: {
            username: 'student1',
            email: 'student1@bee.edu.vn',
            passwordHash: studentPassword,
            firstName: 'Nguyễn',
            lastName: 'Văn A',
        },
    });

    const studentUser2 = await prisma.user.upsert({
        where: { username: 'student2' },
        update: {},
        create: {
            username: 'student2',
            email: 'student2@bee.edu.vn',
            passwordHash: studentPassword,
            firstName: 'Trần',
            lastName: 'Thị B',
        },
    });

    // 6. Tạo student records
    const student1 = await prisma.student.upsert({
        where: { userId: studentUser1.userId },
        update: {},
        create: {
            userId: studentUser1.userId,
            studentPhone: '0901234567',
            parentPhone: '0987654321',
            grade: 12,
            school: 'Trường THPT Nguyễn Huệ',
        },
    });

    const student2 = await prisma.student.upsert({
        where: { userId: studentUser2.userId },
        update: {},
        create: {
            userId: studentUser2.userId,
            studentPhone: '0901234568',
            parentPhone: '0987654322',
            grade: 11,
            school: 'Trường THPT Lê Lợi',
        },
    });

    // 7. Gán student role bằng UserRole
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: studentUser1.userId,
                roleId: studentRole.roleId,
            },
        },
        update: {},
        create: {
            userId: studentUser1.userId,
            roleId: studentRole.roleId,
            assignedBy: adminUser.userId, // Được admin cấp
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Hết hạn sau 1 năm
        },
    });

    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: studentUser2.userId,
                roleId: studentRole.roleId,
            },
        },
        update: {},
        create: {
            userId: studentUser2.userId,
            roleId: studentRole.roleId,
            assignedBy: adminUser.userId, // Được admin cấp
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Hết hạn sau 1 năm
        },
    });

    console.log(`✅ Student users created: ${studentUser1.username}, ${studentUser2.username}`);

    // 8. Tạo courses
    console.log('📚 Seeding courses...');
    const mathCourse = await prisma.course.upsert({
        where: { courseId: 1 },
        update: {},
        create: {
            title: 'Toán học 12',
            subtitle: 'Khóa học Toán học lớp 12',
            grade: '12',
            subject: 'Toán học',
            teacherId: adminRecord.adminId,
            priceCents: 200000000, // 2,000,000 VND * 100
            visibility: 'PUBLISHED',
        },
    });

    const physicsCourse = await prisma.course.upsert({
        where: { courseId: 2 },
        update: {},
        create: {
            title: 'Vật lý 12',
            subtitle: 'Khóa học Vật lý lớp 12',
            grade: '12',
            subject: 'Vật lý',
            teacherId: adminRecord.adminId,
            priceCents: 180000000, // 1,800,000 VND * 100
            visibility: 'PUBLISHED',
        },
    });

    console.log(`✅ Courses created: ${mathCourse.title}, ${physicsCourse.title}`);

    // 9. Tạo exams
    console.log('📝 Seeding exams...');
    const mathExam = await prisma.exam.upsert({
        where: { examId: 1 },
        update: {},
        create: {
            title: 'Kiểm tra Toán học - Chương 1',
            description: 'Bài kiểm tra chương 1 môn Toán',
            grade: 12,
            subject: 'Toán học',
            createdBy: adminRecord.adminId,
        },
    });

    console.log(`✅ Exam created: ${mathExam.title}`);

    console.log('🎉 Seed completed successfully!');
    console.log(`
📊 Summary:
- Roles: 4 (SUPER_ADMIN, ADMIN, TEACHER, STUDENT) với role hierarchy
- Admin users: 2 (superadmin, admin) 
- Student users: 2 (student1, student2)
- User roles: 5 assignments với expiration dates
- Courses: 2 (Toán học 12, Vật lý 12)
- Exams: 1 (Kiểm tra Toán học - Chương 1)

🔑 Login credentials:
- superadmin / admin123 (SUPER_ADMIN role)
- admin / admin123 (ADMIN + TEACHER roles)
- student1 / student123 (STUDENT role - expires in 1 year)
- student2 / student123 (STUDENT role - expires in 1 year)

🔐 Role hierarchy:
- SUPER_ADMIN → có thể cấp ADMIN
- ADMIN → có thể cấp TEACHER  
- TEACHER → có thể cấp STUDENT
- STUDENT → không cấp được role nào
    `);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
