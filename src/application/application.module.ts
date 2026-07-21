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
import { CourseClassLessonApplicationModule } from './use-cases/courseClassLesson/course-class-lesson.application.module'
import { CourseEnrollmentApplicationModule } from './use-cases/course-enrollment/course-enrollment.application.module'

import { EmailVerificationApplicationModule } from './use-cases/email-verification/email-verification.application.module'
import { LessonApplicationModule } from './use-cases/lesson/lesson.application.module'
import { LearningItemApplicationModule } from './use-cases/learningItem/learning-item.application.module'
import { LessonLearningItemApplicationModule } from './use-cases/lessonLearningItem/lesson-learning-item.application.module'
import { StudentLearningItemApplicationModule } from './use-cases/studentLearningItem/student-learning-item.application.module'
import { StudentPointLogApplicationModule } from './use-cases/studentPointLog/student-point-log.application.module'
import { AuditLogApplicationModule } from './use-cases/log/audit-log.application.module'
import { MediaApplicationModule } from './use-cases/media/media.application.module'
import { MediaFolderApplicationModule } from './use-cases/media-folder/media-folder.application.module'
import { MediaUsageApplicationModule } from './use-cases/media-usage/media-usage.application.module'
import { SeoMediaApplicationModule } from './use-cases/seo-media/seo-media.application.module'
import { PermissionApplicationModule } from './use-cases/permission/permission.application.module'
import { PasswordRecoveryApplicationModule } from './use-cases/reset-password/password-recovery.application.module'
import { AdminProfileApplicationModule } from './use-cases/profile/admin-profile.application.module'
import { StudentProfileApplicationModule } from './use-cases/profile/student-profile.application.module'
import { RoleApplicationModule } from './use-cases/role/role.application.module'
import { StudentApplicationModule } from './use-cases/student/student.application.module'
import { SubjectApplicationModule } from './use-cases/subject/subject.application.module'
import { UserApplicationModule } from './use-cases/user/user.application.module'
import { NotificationApplicationModule } from './use-cases/notification/notification.application.module'
import { TuitionPaymentApplicationModule } from './use-cases/tuition-payment/tuition-payment.application.module'
import { ReceivingBankAccountApplicationModule } from './use-cases/receiving-bank-account/receiving-bank-account.application.module'
import { TuitionGradeBankAccountApplicationModule } from './use-cases/tuition-grade-bank-account/tuition-grade-bank-account.application.module'
import { TuitionCollectionConfigurationApplicationModule } from './use-cases/tuition-collection-configuration/tuition-collection-configuration.application.module'
import { PaymentIntentApplicationModule } from './use-cases/payment-intent/payment-intent.application.module'
import { PaymentAttemptApplicationModule } from './use-cases/payment-attempt/payment-attempt.application.module'
import { BankTransferTransactionApplicationModule } from './use-cases/bank-transfer-transaction/bank-transfer-transaction.application.module'
import { SepayApplicationModule } from './use-cases/sepay/sepay.application.module'
import { BackgroundJobApplicationModule } from './use-cases/background-job/background-job.application.module'
import { ExamImportSessionApplicationModule } from './use-cases/exam-import-session/exam-import-session.application.module'
import { TempExamApplicationModule } from './use-cases/temp-exam/temp-exam.application.module'
import { TempSectionApplicationModule } from './use-cases/temp-section/temp-section.application.module'
import { TempQuestionApplicationModule } from './use-cases/temp-question/temp-question.application.module'
import { TempStatementApplicationModule } from './use-cases/temp-statement/temp-statement.application.module'
import { QuestionApplicationModule } from './use-cases/question/question.application.module'
import { ExamAttemptApplicationModule } from './use-cases/exam-attempt/exam-attempt.application.module'
import { QuestionAnswerApplicationModule } from './use-cases/question-answer/question-answer.application.module'
import { StatementApplicationModule } from './use-cases/statement/statement.application.module'
import { ExamApplicationModule } from './use-cases/exam/exam.application.module'
import { CompetitionApplicationModule } from './use-cases/competition/competition.application.module'
import { CompetitionSubmitApplicationModule } from './use-cases/competition-submit/competition-submit.application.module'
import { SectionApplicationModule } from './use-cases/section/section.application.module'
import { HomeworkContentApplicationModule } from './use-cases/homeworkContent/homework-content.application.module'
import { HomeworkSubmitApplicationModule } from './use-cases/homeworkSubmit/homework-submit.application.module'
import { YoutubeContentApplicationModule } from './use-cases/youtubeContent/youtube-content.application.module'
import { VideoContentApplicationModule } from './use-cases/videoContent/video-content.application.module'
import { DocumentContentApplicationModule } from './use-cases/documentContent/document-content.application.module'
import { MarkdownFixApplicationModule } from './use-cases/markdown-fix/markdown-fix.application.module'
import { ZaloApplicationModule } from './use-cases/zalo/zalo.application.module'
import { QuestionChatApplicationModule } from './use-cases/question-chat/question-chat.application.module'
import { QuestionChatMessageApplicationModule } from './use-cases/question-chat-message/question-chat-message.application.module'
import { DocumentApplicationModule } from './use-cases/document/document.application.module'
import { TeacherProfileApplicationModule } from './use-cases/teacher-profile/teacher-profile.application.module'
import { TagApplicationModule } from './use-cases/tag/tag.application.module'
import { OnlineCoursePaymentApplicationModule } from './use-cases/online-course-payment/online-course-payment.application.module'
import { AchievementApplicationModule } from './use-cases/achievement/achievement.application.module'
import { NewsApplicationModule } from './use-cases/news/news.application.module'
import { ReportApplicationModule } from './use-cases/report/report.application.module'

const modules = [
  // Auth & Account
  AuthApplicationModule,
  PasswordRecoveryApplicationModule,
  EmailVerificationApplicationModule,

  // User & Profile
  UserApplicationModule,
  StudentApplicationModule,
  StudentPointLogApplicationModule,
  AdminProfileApplicationModule,
  StudentProfileApplicationModule,
  AdminApplicationModule,

  // Role & Permission
  RoleApplicationModule,
  PermissionApplicationModule,

  // Media
  MediaApplicationModule,
  MediaFolderApplicationModule,
  MediaUsageApplicationModule,
  SeoMediaApplicationModule,
  DocumentApplicationModule,
  TeacherProfileApplicationModule,
  TagApplicationModule,
  AchievementApplicationModule,
  NewsApplicationModule,
  ReportApplicationModule,

  // Course & Learning
  CourseApplicationModule,
  CourseClassApplicationModule,
  CourseClassLessonApplicationModule,
  CourseEnrollmentApplicationModule,
  SubjectApplicationModule,
  ChapterApplicationModule,
  LessonApplicationModule,
  LearningItemApplicationModule,
  LessonLearningItemApplicationModule,
  StudentLearningItemApplicationModule,

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
  ReceivingBankAccountApplicationModule,
  TuitionGradeBankAccountApplicationModule,
  TuitionCollectionConfigurationApplicationModule,
  PaymentIntentApplicationModule,
  PaymentAttemptApplicationModule,
  BankTransferTransactionApplicationModule,
  SepayApplicationModule,
  BackgroundJobApplicationModule,
  OnlineCoursePaymentApplicationModule,
  // Exam Import Session
  ExamImportSessionApplicationModule,
  TempExamApplicationModule,
  TempSectionApplicationModule,
  TempQuestionApplicationModule,
  TempStatementApplicationModule,
  QuestionApplicationModule,
  ExamAttemptApplicationModule,
  QuestionAnswerApplicationModule,
  StatementApplicationModule,
  ExamApplicationModule,
  CompetitionApplicationModule,
  CompetitionSubmitApplicationModule,
  SectionApplicationModule,

  HomeworkContentApplicationModule,
  HomeworkSubmitApplicationModule,
  YoutubeContentApplicationModule,
  VideoContentApplicationModule,
  DocumentContentApplicationModule,
  MarkdownFixApplicationModule,
  ZaloApplicationModule,

  // Question Chat
  QuestionChatApplicationModule,
  QuestionChatMessageApplicationModule,
]

@Module({
  imports: [InfrastructureModule, ...modules],
  exports: [...modules],
})
export class ApplicationModule {}
