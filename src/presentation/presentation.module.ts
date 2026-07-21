import { Module } from '@nestjs/common'
import { ApplicationModule } from '../application/application.module'
import { SharedModule } from '../shared/shared.module'
import { SocketModule } from '../infrastructure/socket.module'

// Import Gateways
import { NotificationGateway } from './gateways/notification.gateway'
import { StatusGateway } from './gateways/status.gateway'
import { LessonGateway } from './gateways/lesson.gateway'
import { AttendanceGateway } from './gateways/attendance.gateway'
import { CompetitionGateway } from './gateways/competition.gateway'
import { TuitionPaymentIntentGateway } from './gateways/tuition-payment-intent.gateway'
import { SeoTuitionPaymentIntentGateway } from './gateways/seo-tuition-payment-intent.gateway'
import { SeoTuitionPaymentController } from './controllers/seo-tuition-payment.controller'
import { AuthController } from './controllers/auth.controller'
import { RoleController } from './controllers/role.controller'
import { GoogleAuthAdminController } from './controllers/google-auth-admin.controller'
import { GoogleAuthStudentController } from './controllers/google-auth-student.controller'
import { AdminAuditLogController } from './controllers/admin-audit-log.controller'
import { StudentController } from './controllers/student.controller'
import { StudentPointLogController } from './controllers/student-point-log.controller'
import { UserController } from './controllers/user.controller'
import { EmailVerificationController } from './controllers/email-verification.controller'
import { EmailResetPasswordController } from './controllers/email-reset-password.controller'
import { MediaController } from './controllers/media.controller'
import { MediaUsageController } from './controllers/media-usage.controller'
import { MediaFolderController } from './controllers/media-folder.controller'
import { SeoMediaController } from './controllers/seo-media.controller'
import { ProfileAdminController } from './controllers/profile.admin.controller'
import { ProfileStudentController } from './controllers/profile.student.controller'
import { PermissionController } from './controllers/permission.controller'
import { AdminController } from './controllers/admin.controller'
import { AdminStudentController } from './controllers/super-admin.controller'
import { CourseController } from './controllers/course.controller'
import { CourseClassController } from './controllers/course-class.controller'
import { CourseClassLessonController } from './controllers/course-class-lesson.controller'
import { LessonController } from './controllers/lesson.controller'
import { LearningItemController } from './controllers/learning-item.controller'
import { LessonLearningItemController } from './controllers/lesson-learning-item.controller'
import { StudentLearningItemController } from './controllers/student-learning-item.controller'
import { ClassSessionController } from './controllers/class-session.controller'
import { ClassStudentController } from './controllers/class-student.controller'
import { CourseEnrollmentController } from './controllers/course-enrollment.controller'
import { SubjectController } from './controllers/subject.controller'
import { ChapterController } from './controllers/chapter.controller'
import { AttendanceController } from './controllers/attendance.controller'
import { NotificationController } from './controllers/notification.controller'
import { TuitionPaymentController } from './controllers/tuition-payment.controller'
import { ReceivingBankAccountController } from './controllers/receiving-bank-account.controller'
import { TuitionGradeBankAccountController } from './controllers/tuition-grade-bank-account.controller'
import { TuitionCollectionConfigurationController } from './controllers/tuition-collection-configuration.controller'
import { PaymentIntentController } from './controllers/payment-intent.controller'
import { PaymentAttemptController } from './controllers/payment-attempt.controller'
import { BankTransferTransactionController } from './controllers/bank-transfer-transaction.controller'
import { SepayController } from './controllers/sepay.controller'
import { BackgroundJobController } from './controllers/background-job.controller'
import { BackgroundJobLockController } from './controllers/background-job-lock.controller'
import { BackgroundJobRunController } from './controllers/background-job-run.controller'
import { SepayTransactionSyncCursorController } from './controllers/sepay-transaction-sync-cursor.controller'
import { ExamImportSessionController } from './controllers/exam-import-session.controller'
import { TempExamController } from './controllers/temp-exam.controller'
import { TempSectionController } from './controllers/temp-section.controller'
import { TempQuestionController } from './controllers/temp-question.controller'
import { TempStatementController } from './controllers/temp-statement.controller'
import { QuestionController } from './controllers/question.controller'
import { QuestionAnswerController } from './controllers/question-answer.controller'
import { ExamAttemptController } from './controllers/exam-attempt.controller'
import { StatementController } from './controllers/statement.controller'
import { ExamController } from './controllers/exam.controller'
import { CompetitionController } from './controllers/competition.controller'
import { CompetitionSubmitController } from './controllers/competition-submit.controller'
import { DoCompetitionController } from './controllers/do-competition.controller'
import { SectionController } from './controllers/section.controller'
import { HomeworkContentController } from './controllers/homework-content.controller'
import { HomeworkSubmitController } from './controllers/homework-submit.controller'
import { StudentHomeworkSubmitController } from './controllers/student-homework-submit.controller'
import { AdminHomeworkSubmitController } from './controllers/admin-homework-submit.controller'
import { YoutubeContentController } from './controllers/youtube-content.controller'
import { VideoContentController } from './controllers/video-content.controller'
import { DocumentContentController } from './controllers/document-content.controller'
import { HealthController } from './controllers/health.controller'
import { MarkdownFixController } from './controllers/markdown-fix.controller'
import { ZaloController } from './controllers/zalo.controller'
import { QuestionChatController } from './controllers/question-chat.controller'
import { QuestionChatMessageController } from './controllers/question-chat-message.controller'
import { DocumentController } from './controllers/document.controller'
import { TeacherProfileController } from './controllers/teacher-profile.controller'
import { TagController } from './controllers/tag.controller'
import {
  OnlineCourseInvoicePaymentStatusController,
  OnlineCoursePaymentController,
} from './controllers/online-course-payment.controller'
import { AchievementBoardController } from './controllers/achievement-board.controller'
import { NewsArticleController } from './controllers/news-article.controller'
import { PayosOnlineCoursePaymentController } from './controllers/payos-online-course-payment.controller'
import { ReportController } from './controllers/report.controller'
import { BankTransferTransactionScheduler } from './scheduler/bank-transfer-transaction.scheduler'
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
    StudentPointLogController,
    UserController,
    GoogleAuthAdminController,
    GoogleAuthStudentController,
    EmailVerificationController,
    EmailResetPasswordController,
    MediaController,
    MediaUsageController,
    MediaFolderController,
    SeoMediaController,
    DocumentController,
    TeacherProfileController,
    TagController,
    ProfileAdminController,
    ProfileStudentController,
    PermissionController,
    AdminController,
    AdminStudentController,
    CourseController,
    CourseClassController,
    CourseClassLessonController,
    LessonController,
    LearningItemController,
    LessonLearningItemController,
    StudentLearningItemController,
    ClassSessionController,
    ClassStudentController,
    CourseEnrollmentController,
    SubjectController,
    ChapterController,
    AttendanceController,
    NotificationController,
    TuitionPaymentController,
    SeoTuitionPaymentController,
    ReceivingBankAccountController,
    TuitionGradeBankAccountController,
    TuitionCollectionConfigurationController,
    PaymentIntentController,
    PaymentAttemptController,
    BankTransferTransactionController,
    SepayController,
    BackgroundJobController,
    BackgroundJobLockController,
    BackgroundJobRunController,
    SepayTransactionSyncCursorController,
    ExamImportSessionController,
    TempExamController,
    TempSectionController,
    TempQuestionController,
    TempStatementController,
    QuestionController,
    QuestionAnswerController,
    ExamAttemptController,
    StatementController,
    ExamController,
    CompetitionController,
    CompetitionSubmitController,
    DoCompetitionController,
    SectionController,
    HomeworkContentController,
    HomeworkSubmitController,
    StudentHomeworkSubmitController,
    AdminHomeworkSubmitController,
    YoutubeContentController,
    VideoContentController,
    DocumentContentController,
    HealthController,
    MarkdownFixController,
    ZaloController,
    QuestionChatController,
    QuestionChatMessageController,
    OnlineCoursePaymentController,
    PayosOnlineCoursePaymentController,
    OnlineCourseInvoicePaymentStatusController,
    AchievementBoardController,
    NewsArticleController,
    ReportController,
  ],
  providers: [
    // WebSocket Gateways
    NotificationGateway,
    StatusGateway,
    LessonGateway,
    AttendanceGateway,
    CompetitionGateway,
    TuitionPaymentIntentGateway,
    SeoTuitionPaymentIntentGateway,
    BankTransferTransactionScheduler,
  ],
  exports: [
    // Export gateways for use cases to inject
    NotificationGateway,
    StatusGateway,
    LessonGateway,
    AttendanceGateway,
    CompetitionGateway,
    TuitionPaymentIntentGateway,
    SeoTuitionPaymentIntentGateway,
  ],
})
export class PresentationModule {}
