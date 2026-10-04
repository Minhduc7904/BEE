import { Student } from '../../../domain/entities/user/student.entity'
import { User } from '../../../domain/entities/user/user.entity'
import { ParentStudentSummaryDto } from './parent-auth.dto'

describe('ParentStudentSummaryDto', () => {
  it('trả firstName riêng để mobile hiển thị tên gọi ngắn', () => {
    const student = new Student({
      studentId: 12,
      userId: 112,
      grade: 8,
      school: 'THCS BeeEdu',
      user: new User({
        userId: 112,
        username: 'student-12',
        passwordHash: 'hash',
        firstName: 'Minh An',
        lastName: 'Nguyễn Văn',
        isActive: true,
      }),
    })

    const summary = ParentStudentSummaryDto.fromStudent(student)

    expect(summary.fullName).toBe('Nguyễn Văn Minh An')
    expect(summary.firstName).toBe('Minh An')
  })

  it('không có user thì không trả firstName', () => {
    const student = new Student({ studentId: 13, userId: 113, grade: 8 })

    const summary = ParentStudentSummaryDto.fromStudent(student)

    expect(summary.fullName).toBe('Student #13')
    expect(summary.firstName).toBeUndefined()
  })
})
