import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Tạo roles với hierarchy
    // console.log('📝 Seeding roles...');
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

    // const superAdminUser = await prisma.user.upsert({
    //     where: { username: 'minhduc7904' },
    //     update: {},
    //     create: {
    //         username: 'minhduc7904',
    //         email: 'nmduc7904@gmail.com',
    //         passwordHash: hashedPassword,
    //         firstName: 'Đức',
    //         lastName: 'Nguyễn Minh',
    //     },
    // });

    // const adminUser = await prisma.user.upsert({
    //     where: { username: 'admin' },
    //     update: {},
    //     create: {
    //         username: 'admin',
    //         email: 'admin@bee.edu.vn',
    //         passwordHash: hashedPassword,
    //         firstName: 'Admin',
    //         lastName: 'User',
    //     },
    // });

    // // 3. Tạo admin records
    // const superAdmin = await prisma.admin.upsert({
    //     where: { userId: superAdminUser.userId },
    //     update: {},
    //     create: {
    //         userId: superAdminUser.userId,
    //     },
    // });

    // const adminRecord = await prisma.admin.upsert({
    //     where: { userId: adminUser.userId },
    //     update: {},
    //     create: {
    //         userId: adminUser.userId,
    //     },
    // });

    // // 4. Gán roles cho admins bằng UserRole
    // await prisma.userRole.upsert({
    //     where: {
    //         userId_roleId: {
    //             userId: superAdminUser.userId,
    //             roleId: superAdminRole.roleId,
    //         },
    //     },
    //     update: {},
    //     create: {
    //         userId: superAdminUser.userId,
    //         roleId: superAdminRole.roleId,
    //         assignedBy: null, // Tự cấp
    //         expiresAt: null, // Vĩnh viễn
    //     },
    // });

    // await prisma.userRole.upsert({
    //     where: {
    //         userId_roleId: {
    //             userId: adminUser.userId,
    //             roleId: adminRole.roleId,
    //         },
    //     },
    //     update: {},
    //     create: {
    //         userId: adminUser.userId,
    //         roleId: adminRole.roleId,
    //         assignedBy: superAdminUser.userId, // Được SUPER_ADMIN cấp
    //         expiresAt: null, // Vĩnh viễn
    //     },
    // });

    // await prisma.userRole.upsert({
    //     where: {
    //         userId_roleId: {
    //             userId: adminUser.userId,
    //             roleId: permissionsUserRole.roleId,
    //         },
    //     },
    //     update: {},
    //     create: {
    //         userId: adminUser.userId,
    //         roleId: permissionsUserRole.roleId,
    //         assignedBy: superAdminUser.userId, // Được SUPER_ADMIN cấp thêm role PERMISSIONS_USER
    //         expiresAt: null,
    //     },
    // });

    // await prisma.userRole.upsert({
    //     where: {
    //         userId_roleId: {
    //             userId: adminUser.userId,
    //             roleId: teacherRole.roleId,
    //         },
    //     },
    //     update: {},
    //     create: {
    //         userId: adminUser.userId,
    //         roleId: teacherRole.roleId,
    //         assignedBy: superAdminUser.userId, // Được SUPER_ADMIN cấp thêm role TEACHER
    //         expiresAt: null,
    //     },
    // });

    // console.log(`✅ Admin users created: ${superAdminUser.username}, ${adminUser.username}`);

    // // 5. Tạo student users
    // console.log('👨‍🎓 Seeding student users...');
    // const studentPassword = await bcrypt.hash('student123', 10);

    // const studentUser1 = await prisma.user.upsert({
    //     where: { username: 'student1' },
    //     update: {},
    //     create: {
    //         username: 'student1',
    //         email: 'nmduc7904@gmail.com',
    //         passwordHash: studentPassword,
    //         firstName: 'Nguyễn',
    //         lastName: 'Văn A',
    //     },
    // });

    // const studentUser2 = await prisma.user.upsert({
    //     where: { username: 'student2' },
    //     update: {},
    //     create: {
    //         username: 'student2',
    //         email: 'nmduc7904@gmail.com',
    //         passwordHash: studentPassword,
    //         firstName: 'Trần',
    //         lastName: 'Thị B',
    //     },
    // });

    // // 6. Tạo student records
    // const student1 = await prisma.student.upsert({
    //     where: { userId: studentUser1.userId },
    //     update: {},
    //     create: {
    //         userId: studentUser1.userId,
    //         studentPhone: '0901234567',
    //         parentPhone: '0987654321',
    //         grade: 12,
    //         school: 'Trường THPT Nguyễn Huệ',
    //     },
    // });

    // const student2 = await prisma.student.upsert({
    //     where: { userId: studentUser2.userId },
    //     update: {},
    //     create: {
    //         userId: studentUser2.userId,
    //         studentPhone: '0901234568',
    //         parentPhone: '0987654322',
    //         grade: 11,
    //         school: 'Trường THPT Lê Lợi',
    //     },
    // });

    // // 7. Gán student role bằng UserRole
    // await prisma.userRole.upsert({
    //     where: {
    //         userId_roleId: {
    //             userId: studentUser1.userId,
    //             roleId: studentRole.roleId,
    //         },
    //     },
    //     update: {},
    //     create: {
    //         userId: studentUser1.userId,
    //         roleId: studentRole.roleId,
    //         assignedBy: adminUser.userId, // Được admin cấp
    //         expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Hết hạn sau 1 năm
    //     },
    // });

    // await prisma.userRole.upsert({
    //     where: {
    //         userId_roleId: {
    //             userId: studentUser2.userId,
    //             roleId: studentRole.roleId,
    //         },
    //     },
    //     update: {},
    //     create: {
    //         userId: studentUser2.userId,
    //         roleId: studentRole.roleId,
    //         assignedBy: adminUser.userId, // Được admin cấp
    //         expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Hết hạn sau 1 năm
    //     },
    // });

    // console.log(`✅ Student users created: ${studentUser1.username}, ${studentUser2.username}`);

    // // 8. Tạo subjects
    // console.log('📖 Seeding subjects...');
    // const mathSubject = await prisma.subject.upsert({
    //     where: { name: 'Toán học' },
    //     update: {},
    //     create: {
    //         name: 'Toán học',
    //         code: 'MATH',
    //     },
    // });

    // const physicsSubject = await prisma.subject.upsert({
    //     where: { name: 'Vật lý' },
    //     update: {},
    //     create: {
    //         name: 'Vật lý',
    //         code: 'PHY',
    //     },
    // });

    // const chemistrySubject = await prisma.subject.upsert({
    //     where: { name: 'Hóa học' },
    //     update: {},
    //     create: {
    //         name: 'Hóa học',
    //         code: 'CHEM',
    //     },
    // });

    // console.log(`✅ Subjects created: ${mathSubject.name}, ${physicsSubject.name}, ${chemistrySubject.name}`);

    // // 9. Tạo chapters cho môn Toán từ dữ liệu thực
    // console.log('📑 Seeding real Math chapters...');

    // // Lưu trữ chapters cha để tham chiếu
    // const parentChapters = new Map();
    // let totalChapters = 0;
    // let rootChapters = 0;
    // let subChapters = 0;

    // // GRADE 10 CHAPTERS
    // console.log('📚 Creating Grade 10 chapters...');

    // // 10C1 - MỆNH ĐỀ VÀ TẬP HỢP (Chapter cha)
    // const chap_10c1 = await prisma.chapter.upsert({
    //     where: { slug: '10c1' },
    //     update: {},
    //     create: {
    //         subjectId: mathSubject.subjectId,
    //         name: 'MỆNH ĐỀ VÀ TẬP HỢP',
    //         slug: '10c1',
    //         parentChapterId: null,
    //         orderInParent: 1,
    //         level: 0,
    //     },
    // });
    // parentChapters.set('10c1', chap_10c1);
    // totalChapters++; rootChapters++;

    // // 10C11, 10C12 - Chapters con của 10C1
    // await prisma.chapter.upsert({
    //     where: { slug: '10c11' },
    //     update: {},
    //     create: {
    //         subjectId: mathSubject.subjectId,
    //         name: 'Mệnh đề',
    //         slug: '10c11',
    //         parentChapterId: chap_10c1.chapterId,
    //         orderInParent: 1,
    //         level: 1,
    //     },
    // });
    // totalChapters++; subChapters++;

    // await prisma.chapter.upsert({
    //     where: { slug: '10c12' },
    //     update: {},
    //     create: {
    //         subjectId: mathSubject.subjectId,
    //         name: 'Tập hợp và các phép toán trên tập hợp',
    //         slug: '10c12',
    //         parentChapterId: chap_10c1.chapterId,
    //         orderInParent: 2,
    //         level: 1,
    //     },
    // });
    // totalChapters++; subChapters++;

    // // 10C2 - BẤT PHƯƠNG TRÌNH VÀ HỆ BẤT PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN
    // const chap_10c2 = await prisma.chapter.upsert({
    //     where: { slug: '10c2' },
    //     update: {},
    //     create: {
    //         subjectId: mathSubject.subjectId,
    //         name: 'BẤT PHƯƠNG TRÌNH VÀ HỆ BẤT PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN',
    //         slug: '10c2',
    //         parentChapterId: null,
    //         orderInParent: 2,
    //         level: 0,
    //     },
    // });
    // parentChapters.set('10c2', chap_10c2);
    // totalChapters++; rootChapters++;

    // // 10C21, 10C22 - Chapters con của 10C2
    // await prisma.chapter.upsert({
    //     where: { slug: '10c21' },
    //     update: {},
    //     create: {
    //         subjectId: mathSubject.subjectId,
    //         name: 'Bất phương trình bậc nhất hai ẩn',
    //         slug: '10c21',
    //         parentChapterId: chap_10c2.chapterId,
    //         orderInParent: 1,
    //         level: 1,
    //     },
    // });
    // totalChapters++; subChapters++;

    // await prisma.chapter.upsert({
    //     where: { slug: '10c22' },
    //     update: {},
    //     create: {
    //         subjectId: mathSubject.subjectId,
    //         name: 'Hệ bất phương trình bậc nhất hai ẩn',
    //         slug: '10c22',
    //         parentChapterId: chap_10c2.chapterId,
    //         orderInParent: 2,
    //         level: 1,
    //     },
    // });
    // totalChapters++; subChapters++;

    // // Tiếp tục với các chapters còn lại...
    // // 10C3 - HỆ THỨC LƯỢNG TRONG TAM GIÁC
    // const chap_10c3 = await prisma.chapter.upsert({
    //     where: { slug: '10c3' },
    //     update: {},
    //     create: {
    //         subjectId: mathSubject.subjectId,
    //         name: 'HỆ THỨC LƯỢNG TRONG TAM GIÁC',
    //         slug: '10c3',
    //         parentChapterId: null,
    //         orderInParent: 3,
    //         level: 0,
    //     },
    // });
    // totalChapters++; rootChapters++;

    // await prisma.chapter.upsert({
    //     where: { slug: '10c31' },
    //     update: {},
    //     create: {
    //         subjectId: mathSubject.subjectId,
    //         name: 'Giá trị lượng giác của một góc từ 0° đến 180°',
    //         slug: '10c31',
    //         parentChapterId: chap_10c3.chapterId,
    //         orderInParent: 1,
    //         level: 1,
    //     },
    // });
    // totalChapters++; subChapters++;

    // await prisma.chapter.upsert({
    //     where: { slug: '10c32' },
    //     update: {},
    //     create: {
    //         subjectId: mathSubject.subjectId,
    //         name: 'Hệ thức lượng trong tam giác°',
    //         slug: '10c32',
    //         parentChapterId: chap_10c3.chapterId,
    //         orderInParent: 2,
    //         level: 1,
    //     },
    // });
    // totalChapters++; subChapters++;

    // // 10C4 - VECTƠ (với nhiều sub-chapters)
    // const chap_10c4 = await prisma.chapter.upsert({
    //     where: { slug: '10c4' },
    //     update: {},
    //     create: {
    //         subjectId: mathSubject.subjectId,
    //         name: 'VECTƠ',
    //         slug: '10c4',
    //         parentChapterId: null,
    //         orderInParent: 4,
    //         level: 0,
    //     },
    // });
    // totalChapters++; rootChapters++;

    // // Sub-chapters của VECTƠ
    // const vectorSubChapters = [
    //     { slug: '10c41', name: 'Các khái niệm mở đầu', order: 1 },
    //     { slug: '10c42', name: 'Tổng và hiệu của hai vectơ', order: 2 },
    //     { slug: '10c43', name: 'Tích của một vectơ với một số', order: 3 },
    //     { slug: '10c44', name: 'Vectơ trong mặt phẳng toạ độ', order: 4 },
    //     { slug: '10c45', name: 'Tích vô hướng của hai vectơ', order: 5 },
    // ];

    // for (const sub of vectorSubChapters) {
    //     await prisma.chapter.upsert({
    //         where: { slug: sub.slug },
    //         update: {},
    //         create: {
    //             subjectId: mathSubject.subjectId,
    //             name: sub.name,
    //             slug: sub.slug,
    //             parentChapterId: chap_10c4.chapterId,
    //             orderInParent: sub.order,
    //             level: 1,
    //         },
    //     });
    //     totalChapters++; subChapters++;
    // }

    // console.log(`✅ Grade 10 chapters created successfully`);

    // // GRADE 11 CHAPTERS - Tạo một số chapters chính
    // console.log('📚 Creating Grade 11 chapters...');

    // // 11C1 - HÀM SỐ LƯỢNG GIÁC VÀ PHƯƠNG TRÌNH LƯỢNG GIÁC
    // const chap_11c1 = await prisma.chapter.upsert({
    //     where: { slug: '11c1' },
    //     update: {},
    //     create: {
    //         subjectId: mathSubject.subjectId,
    //         name: 'HÀM SỐ LƯỢNG GIÁC VÀ PHƯƠNG TRÌNH LƯỢNG GIÁC',
    //         slug: '11c1',
    //         parentChapterId: null,
    //         orderInParent: 1,
    //         level: 0,
    //     },
    // });
    // totalChapters++; rootChapters++;

    // // Sub-chapters của 11C1
    // const trigSubChapters = [
    //     { slug: '11c11', name: 'Giá trị lượng giác của góc lượng giác', order: 1 },
    //     { slug: '11c12', name: 'Công thức lượng giác', order: 2 },
    //     { slug: '11c13', name: 'Hàm số lượng giác', order: 3 },
    //     { slug: '11c14', name: 'Phương trình lượng giác cơ bản', order: 4 },
    // ];

    // for (const sub of trigSubChapters) {
    //     await prisma.chapter.upsert({
    //         where: { slug: sub.slug },
    //         update: {},
    //         create: {
    //             subjectId: mathSubject.subjectId,
    //             name: sub.name,
    //             slug: sub.slug,
    //             parentChapterId: chap_11c1.chapterId,
    //             orderInParent: sub.order,
    //             level: 1,
    //         },
    //     });
    //     totalChapters++; subChapters++;
    // }

    // // GRADE 12 CHAPTERS - Tạo một số chapters chính
    // console.log('📚 Creating Grade 12 chapters...');

    // // 12C1 - ỨNG DỤNG ĐẠO HÀM ĐỂ KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ
    // const chap_12c1 = await prisma.chapter.upsert({
    //     where: { slug: '12c1' },
    //     update: {},
    //     create: {
    //         subjectId: mathSubject.subjectId,
    //         name: 'ỨNG DỤNG ĐẠO HÀM ĐỂ KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ',
    //         slug: '12c1',
    //         parentChapterId: null,
    //         orderInParent: 1,
    //         level: 0,
    //     },
    // });
    // totalChapters++; rootChapters++;

    // // Sub-chapters của 12C1
    // const derivativeSubChapters = [
    //     { slug: '12c11', name: 'Tính đơn điệu và cực trị của hàm số', order: 1 },
    //     { slug: '12c12', name: 'Giá trị lớn nhất và giá trị nhỏ nhất của hàm số', order: 2 },
    //     { slug: '12c13', name: 'Đường tiệm cận của đồ thị hàm số', order: 3 },
    //     { slug: '12c14', name: 'Khảo sát sự biến thiên và vẽ đồ thị của hàm số', order: 4 },
    //     { slug: '12c15', name: 'Ứng dụng đạo hàm để giải quyết một số vấn đề liên quan đến thực tiễn', order: 5 },
    // ];

    // for (const sub of derivativeSubChapters) {
    //     await prisma.chapter.upsert({
    //         where: { slug: sub.slug },
    //         update: {},
    //         create: {
    //             subjectId: mathSubject.subjectId,
    //             name: sub.name,
    //             slug: sub.slug,
    //             parentChapterId: chap_12c1.chapterId,
    //             orderInParent: sub.order,
    //             level: 1,
    //         },
    //     });
    //     totalChapters++; subChapters++;
    // }

    // // 12C4 - NGUYÊN HÀM VÀ TÍCH PHÂN
    // const chap_12c4 = await prisma.chapter.upsert({
    //     where: { slug: '12c4' },
    //     update: {},
    //     create: {
    //         subjectId: mathSubject.subjectId,
    //         name: 'NGUYÊN HÀM VÀ TÍCH PHÂN',
    //         slug: '12c4',
    //         parentChapterId: null,
    //         orderInParent: 4,
    //         level: 0,
    //     },
    // });
    // totalChapters++; rootChapters++;

    // // Sub-chapters của 12C4
    // const integralSubChapters = [
    //     { slug: '12c41', name: 'Nguyên hàm', order: 1 },
    //     { slug: '12c42', name: 'Tích phân', order: 2 },
    //     { slug: '12c43', name: 'Ứng dụng hình học của tích phân', order: 3 },
    // ];

    // for (const sub of integralSubChapters) {
    //     await prisma.chapter.upsert({
    //         where: { slug: sub.slug },
    //         update: {},
    //         create: {
    //             subjectId: mathSubject.subjectId,
    //             name: sub.name,
    //             slug: sub.slug,
    //             parentChapterId: chap_12c4.chapterId,
    //             orderInParent: sub.order,
    //             level: 1,
    //         },
    //     });
    //     totalChapters++; subChapters++;
    // }

    // console.log(`✅ Math chapters created: ${rootChapters} root chapters with ${subChapters} sub-chapters (Total: ${totalChapters} chapters)`);

    // // 10. Tạo courses
    // console.log('📚 Seeding courses...');
    // const mathCourse = await prisma.course.upsert({
    //     where: { courseId: 1 },
    //     update: {},
    //     create: {
    //         title: 'Toán học 12',
    //         subtitle: 'Khóa học Toán học lớp 12',
    //         grade: '12',
    //         subjectId: mathSubject.subjectId,
    //         teacherId: adminRecord.adminId,
    //         priceCents: 200000000, // 2,000,000 VND * 100
    //         visibility: 'PUBLISHED',
    //     },
    // });

    // const physicsCourse = await prisma.course.upsert({
    //     where: { courseId: 2 },
    //     update: {},
    //     create: {
    //         title: 'Vật lý 12',
    //         subtitle: 'Khóa học Vật lý lớp 12',
    //         grade: '12',
    //         subjectId: physicsSubject.subjectId,
    //         teacherId: adminRecord.adminId,
    //         priceCents: 180000000, // 1,800,000 VND * 100
    //         visibility: 'PUBLISHED',
    //     },
    // });

    // const chemistryCourse = await prisma.course.upsert({
    //     where: { courseId: 3 },
    //     update: {},
    //     create: {
    //         title: 'Hóa học 12',
    //         subtitle: 'Khóa học Hóa học lớp 12',
    //         grade: '12',
    //         subjectId: chemistrySubject.subjectId,
    //         teacherId: adminRecord.adminId,
    //         priceCents: 190000000, // 1,900,000 VND * 100
    //         visibility: 'PUBLISHED',
    //     },
    // });

    // console.log(`✅ Courses created: ${mathCourse.title}, ${physicsCourse.title}, ${chemistryCourse.title}`);

    // // 10. Tạo exams
    // console.log('📝 Seeding exams...');
    // const mathExam = await prisma.exam.upsert({
    //     where: { examId: 1 },
    //     update: {},
    //     create: {
    //         title: 'Kiểm tra Toán học - Chương 1',
    //         description: 'Bài kiểm tra chương 1 môn Toán',
    //         grade: 12,
    //         subjectId: mathSubject.subjectId,
    //         createdBy: adminRecord.adminId,
    //     },
    // });

    // const physicsExam = await prisma.exam.upsert({
    //     where: { examId: 2 },
    //     update: {},
    //     create: {
    //         title: 'Kiểm tra Vật lý - Chương 1',
    //         description: 'Bài kiểm tra chương 1 môn Vật lý',
    //         grade: 12,
    //         subjectId: physicsSubject.subjectId,
    //         createdBy: adminRecord.adminId,
    //     },
    // });

    // console.log(`✅ Exams created: ${mathExam.title}, ${physicsExam.title}`);

    console.log('🎉 Seed completed successfully!');
    console.log(`
📊 Summary:
- Roles: 5 (SUPER_ADMIN, ADMIN, PERMISSIONS_USER, TEACHER, STUDENT) với role hierarchy
- Admin users: 2 (minhduc7904, admin) 
- Student users: 2 (student1, student2)
- User roles: 5 assignments với expiration dates
- Subjects: 6 (Toán học, Vật lý, Hóa học, Ngữ văn, Tiếng Anh, Sinh học)
- Chapters: Toán học từ lớp 10-12 (root chapters + sub-chapters theo chương trình thực)
- Courses: 3 (Toán học 12, Vật lý 12, Hóa học 12)
- Exams: 2 (Kiểm tra Toán học - Chương 1, Kiểm tra Vật lý - Chương 1)

🔑 Login credentials:
- minhduc7904 / 070904 (SUPER_ADMIN role)
- admin / 070904 (ADMIN + PERMISSIONS_USER + TEACHER roles)
- student1 / student123 (STUDENT role - expires in 1 year)
- student2 / student123 (STUDENT role - expires in 1 year)

🔐 Role hierarchy:
- SUPER_ADMIN → có thể cấp mọi role
- ADMIN → cần có để cấp PERMISSIONS_USER
- PERMISSIONS_USER → cần có để cấp TEACHER, STUDENT
- TEACHER/STUDENT → không cấp được role nào
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
