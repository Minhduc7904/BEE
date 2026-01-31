import { Module } from '@nestjs/common'
import { InfrastructureModule } from '../infrastructure/infrastructure.module'

import { AuthApplicationModule } from './use-cases/auth/auth.application.module'
import { AttendanceApplicationModule } from './use-cases/attendance/attendance.application.module'
import { AdminApplicationModule } from './use-cases/admin/admin.application.module'
import { ChapterApplicationModule } from './use-cases/chapter/chapter.application.module'
import { ClassSessionApplicationModule } from './use-cases/class-session/class-session.application.module'
import { ClassStudentApplicationModule } from './use-cases/class-student/class-student.application.module'
import { CourseApplicationModule } from './use-cases/course/course.application.module'
import { CourseClassApplicationModule } from './use-cases/course-class/course-class.application.module'
import { CourseEnrollmentApplicationModule } from './use-cases/course-enrollment/course-enrollment.application.module'

import { EmailVerificationApplicationModule } from './use-cases/email-verification/email-verification.application.module'
import { LessonApplicationModule } from './use-cases/lesson/lesson.application.module'
import { LearningItemApplicationModule } from './use-cases/learningItem/learning-item.application.module'
import { LessonLearningItemApplicationModule } from './use-cases/lessonLearningItem/lesson-learning-item.application.module'
import { AuditLogApplicationModule } from './use-cases/log/audit-log.application.module'
import { MediaApplicationModule } from './use-cases/media/media.application.module'
import { MediaFolderApplicationModule } from './use-cases/media-folder/media-folder.application.module'
import { MediaUsageApplicationModule } from './use-cases/media-usage/media-usage.application.module'
import { PermissionApplicationModule } from './use-cases/permission/permission.application.module'
import { PasswordRecoveryApplicationModule } from './use-cases/reset-password/password-recovery.application.module'
import { AdminProfileApplicationModule } from './use-cases/profile/admin-profile.application.module'
import { RoleApplicationModule } from './use-cases/role/role.application.module'
import { StudentApplicationModule } from './use-cases/student/student.application.module'
import { SubjectApplicationModule } from './use-cases/subject/subject.application.module'
import { UserApplicationModule } from './use-cases/user/user.application.module'
import { NotificationApplicationModule } from './use-cases/notification/notification.application.module'
import { TuitionPaymentApplicationModule } from './use-cases/tuition-payment/tuition-payment.application.module'
import { ExamImportSessionApplicationModule } from './use-cases/exam-import-session/exam-import-session.application.module'
import { TempExamApplicationModule } from './use-cases/temp-exam/temp-exam.application.module'
const modules = [
  // Auth & Account
  AuthApplicationModule,
  PasswordRecoveryApplicationModule,
  EmailVerificationApplicationModule,

  // User & Profile
  UserApplicationModule,
  StudentApplicationModule,
  AdminProfileApplicationModule,
  AdminApplicationModule,

  // Role & Permission
  RoleApplicationModule,
  PermissionApplicationModule,

  // Media
  MediaApplicationModule,
  MediaFolderApplicationModule,
  MediaUsageApplicationModule,

  // Course & Learning
  CourseApplicationModule,
  CourseClassApplicationModule,
  CourseEnrollmentApplicationModule,
  SubjectApplicationModule,
  ChapterApplicationModule,
  LessonApplicationModule,
  LearningItemApplicationModule,
  LessonLearningItemApplicationModule,

  // Class & Attendance
  ClassSessionApplicationModule,
  ClassStudentApplicationModule,
  AttendanceApplicationModule,

  // Audit
  AuditLogApplicationModule,
  // Notification
  NotificationApplicationModule,
  // Tuition Payment
  TuitionPaymentApplicationModule,
  // Exam Import Session
  ExamImportSessionApplicationModule,
  TempExamApplicationModule,
]

@Module({
  imports: [
    InfrastructureModule,
    ...modules,
  ],
  exports: [
    ...modules,
  ],
})
export class ApplicationModule { }
