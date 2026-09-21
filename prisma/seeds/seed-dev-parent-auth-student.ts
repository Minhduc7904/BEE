import { Gender, PrismaClient, Student } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

export const DEV_PARENT_PHONE = '0392923661'
export const DEV_PASSWORD = 'Dev@123456'

export interface DevStudentFixture {
  index: number
  studentId: number
  userId: number
  firstName: string
  lastName: string
  fullName: string
  grade: number
  school: string
}

export interface DevParentFixtureContext {
  parentId: number
  parentUserId: number
  parentPhone: string
  students: DevStudentFixture[]
}

const DEV_STUDENTS = [
  {
    username: 'dev.student.parent.0392923661',
    firstName: 'An',
    lastName: 'Nguyễn Minh',
    gender: Gender.FEMALE,
    grade: 8,
    school: 'THCS BeeEdu',
    storedStudentPhone: '0901234567',
    inputStudentPhone: '0901234567',
    storedParentPhone: DEV_PARENT_PHONE,
  },
  {
    username: 'dev.student.parent.0392923661.02',
    firstName: 'Bảo',
    lastName: 'Trần Gia',
    gender: Gender.MALE,
    grade: 7,
    school: 'THCS Nguyễn Du',
    storedStudentPhone: '84912345678',
    inputStudentPhone: '0912345678',
    storedParentPhone: '84392923661',
  },
  {
    username: 'dev.student.parent.0392923661.03',
    firstName: 'Chi',
    lastName: 'Lê Mai',
    gender: Gender.FEMALE,
    grade: 9,
    school: 'THCS Trần Phú',
    storedStudentPhone: '+84932345678',
    inputStudentPhone: '0932345678',
    storedParentPhone: '+84392923661',
  },
  {
    username: 'dev.student.parent.0392923661.04',
    firstName: 'Dũng',
    lastName: 'Phạm Anh',
    gender: Gender.MALE,
    grade: 6,
    school: 'THCS Lê Quý Đôn',
    storedStudentPhone: '0942345678',
    inputStudentPhone: '0942345678',
    storedParentPhone: DEV_PARENT_PHONE,
  },
] as const

export async function seedDevParentAuthStudent(prisma: PrismaClient): Promise<DevParentFixtureContext> {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10)

  const seededStudents = await prisma.$transaction(async (transaction) => {
    const parentUser = await transaction.user.upsert({
      where: { username: DEV_PARENT_PHONE },
      update: {
        passwordHash,
        firstName: 'Phụ huynh',
        lastName: 'Demo',
        gender: Gender.FEMALE,
        isActive: true,
      },
      create: {
        username: DEV_PARENT_PHONE,
        passwordHash,
        firstName: 'Phụ huynh',
        lastName: 'Demo',
        gender: Gender.FEMALE,
        isActive: true,
      },
    })

    const parent = await transaction.parent.upsert({
      where: { phone: DEV_PARENT_PHONE },
      update: { userId: parentUser.userId },
      create: {
        userId: parentUser.userId,
        phone: DEV_PARENT_PHONE,
      },
    })

    const students: Student[] = []
    for (const fixture of DEV_STUDENTS) {
      const user = await transaction.user.upsert({
        where: { username: fixture.username },
        update: {
          passwordHash,
          firstName: fixture.firstName,
          lastName: fixture.lastName,
          gender: fixture.gender,
          isActive: true,
        },
        create: {
          username: fixture.username,
          passwordHash,
          firstName: fixture.firstName,
          lastName: fixture.lastName,
          gender: fixture.gender,
          isActive: true,
        },
      })

      const student = await transaction.student.upsert({
        where: { userId: user.userId },
        update: {
          studentPhone: fixture.storedStudentPhone,
          parentPhone: fixture.storedParentPhone,
          grade: fixture.grade,
          school: fixture.school,
        },
        create: {
          userId: user.userId,
          studentPhone: fixture.storedStudentPhone,
          parentPhone: fixture.storedParentPhone,
          grade: fixture.grade,
          school: fixture.school,
        },
      })

      await transaction.parentStudent.upsert({
        where: {
          parentId_studentId: {
            parentId: parent.parentId,
            studentId: student.studentId,
          },
        },
        update: {},
        create: {
          parentId: parent.parentId,
          studentId: student.studentId,
        },
      })

      students.push(student)
    }

    return { parent, parentUser, students }
  })

  console.log(`✅ Dev Parent Auth recovery ready: parentPhone=${DEV_PARENT_PHONE}, password=${DEV_PASSWORD}`)
  console.table(
    seededStudents.students.map((student, index) => ({
      studentId: student.studentId,
      fullName: `${DEV_STUDENTS[index].lastName} ${DEV_STUDENTS[index].firstName}`,
      school: DEV_STUDENTS[index].school,
      studentPhoneToInput: DEV_STUDENTS[index].inputStudentPhone,
      parentPhoneToInput: DEV_PARENT_PHONE,
    })),
  )

  return {
    parentId: seededStudents.parent.parentId,
    parentUserId: seededStudents.parentUser.userId,
    parentPhone: DEV_PARENT_PHONE,
    students: seededStudents.students.map((student, index) => ({
      index,
      studentId: student.studentId,
      userId: student.userId,
      firstName: DEV_STUDENTS[index].firstName,
      lastName: DEV_STUDENTS[index].lastName,
      fullName: `${DEV_STUDENTS[index].lastName} ${DEV_STUDENTS[index].firstName}`,
      grade: DEV_STUDENTS[index].grade,
      school: DEV_STUDENTS[index].school,
    })),
  }
}
