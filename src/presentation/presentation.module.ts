import { Module } from '@nestjs/common'
import { ApplicationModule } from '../application/application.module'
import { SharedModule } from '../shared/shared.module'
import { SocketModule } from '../infrastructure/socket.module'

// Import Gateways
import { NotificationGateway } from './gateways/notification.gateway'
import { StatusGateway } from './gateways/status.gateway'
import { LessonGateway } from './gateways/lesson.gateway'
import { AttendanceGateway } from './gateways/attendance.gateway'

import { AuthController } from './controllers/auth.controller'
import { RoleController } from './controllers/role.controller'
import { GoogleAuthAdminController } from './controllers/google-auth-admin.controller'
import { GoogleAuthStudentController } from './controllers/google-auth-student.controller'
import { AdminAuditLogController } from './controllers/admin-audit-log.controller'
import { StudentController } from './controllers/student.controller'
import { UserController } from './controllers/user.controller'
import { EmailVerificationController } from './controllers/email-verification.controller'
import { EmailResetPasswordController } from './controllers/email-reset-password.controller'
import { MediaController } from './controllers/media.controller'
import { MediaUsageController } from './controllers/media-usage.controller'
import { MediaFolderController } from './controllers/media-folder.controller'
import { ProfileAdminController } from './controllers/profile.admin.controller'
import { PermissionController } from './controllers/permission.controller'
import { AdminController } from './controllers/admin.controller'
import { CourseController } from './controllers/course.controller'
import { CourseClassController } from './controllers/course-class.controller'
import { LessonController } from './controllers/lesson.controller'
import { LearningItemController } from './controllers/learning-item.controller'
import { LessonLearningItemController } from './controllers/lesson-learning-item.controller'
import { ClassSessionController } from './controllers/class-session.controller'
import { ClassStudentController } from './controllers/class-student.controller'
import { CourseEnrollmentController } from './controllers/course-enrollment.controller'
import { SubjectController } from './controllers/subject.controller'
import { ChapterController } from './controllers/chapter.controller'
import { AttendanceController } from './controllers/attendance.controller'
import { NotificationController } from './controllers/notification.controller'
import { TuitionPaymentController } from './controllers/tuition-payment.controller'
import { ExamImportSessionController } from './controllers/exam-import-session.controller'
import { TempExamController } from './controllers/temp-exam.controller'
import { TempSectionController } from './controllers/temp-section.controller'
import { TempQuestionController } from './controllers/temp-question.controller'
import { TempStatementController } from './controllers/temp-statement.controller'
import { QuestionController } from './controllers/question.controller'
import { StatementController } from './controllers/statement.controller'
import { ExamController } from './controllers/exam.controller'
import { SectionController } from './controllers/section.controller'
import { HomeworkContentController } from './controllers/homework-content.controller'
import { YoutubeContentController } from './controllers/youtube-content.controller'
import { VideoContentController } from './controllers/video-content.controller'
import { DocumentContentController } from './controllers/document-content.controller'

@Module({
  imports: [
    ApplicationModule, // ✅ lấy toàn bộ UseCase đã export
    SharedModule, // ✅ pipes, guards, filters, decorators
    SocketModule, // ✅ Socket.IO services
  ],
  controllers: [
    AuthController,
    RoleController,
    AdminAuditLogController,
    StudentController,
    UserController,
    GoogleAuthAdminController,
    GoogleAuthStudentController,
    EmailVerificationController,
    EmailResetPasswordController,
    MediaController,
    MediaUsageController,
    MediaFolderController,
    ProfileAdminController,
    PermissionController,
    AdminController,
    CourseController,
    CourseClassController,
    LessonController,
    LearningItemController,
    LessonLearningItemController,
    ClassSessionController,
    ClassStudentController,
    CourseEnrollmentController,
    SubjectController,
    ChapterController,
    AttendanceController,
    NotificationController,
    TuitionPaymentController,
    ExamImportSessionController,
    TempExamController,
    TempSectionController,
    TempQuestionController,
    TempStatementController,
    QuestionController,
    StatementController,
    ExamController,
    SectionController,
    HomeworkContentController,
    YoutubeContentController,
    VideoContentController,
    DocumentContentController,
  ],
  providers: [
    // WebSocket Gateways
    NotificationGateway,
    StatusGateway,
    LessonGateway,
    AttendanceGateway,
  ],
  exports: [
    // Export gateways for use cases to inject
    NotificationGateway,
    StatusGateway,
    LessonGateway,
    AttendanceGateway,
  ],
})
export class PresentationModule {}
