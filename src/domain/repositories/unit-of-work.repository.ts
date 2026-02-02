// src/domain/repositories/unit-of-work.repository.ts
import { IUserRepository } from './user.repository'
import { IAdminRepository } from './admin.repository'
import { IStudentRepository } from './student.repository'
import { IUserRefreshTokenRepository } from './user-refresh-token.repository'
import { IRoleRepository } from './role.repository'
import { IPermissionRepository } from './permission.repository'
import { IAdminAuditLogRepository } from './admin-audit-log.repository'
import { IMediaRepository } from './media.repository'
import { ISubjectRepository } from './subject.repository'
import { IChapterRepository } from './chapter.repository'
import { IAttendanceRepository } from './attendance.repository'
import { IClassSessionRepository } from './class-session.repository'
import { IClassStudentRepository } from './class-student.repository'
import { ICourseRepository } from './course.repository'
import { ICourseClassRepository } from './course-class.repository'
import { ICourseEnrollmentRepository } from './course-enrollment.repository'
import { ILearningItemRepository } from './learning-item.repository'
import { ILessonLearningItemRepository } from './lesson-learning-item.repository'
import { IDocumentContentRepository } from './document-content.repository'
import { IHomeworkContentRepository } from './homework-content.repository'
import { IHomeworkSubmitRepository } from './homework-submit.repository'
import { IVideoContentRepository } from './video-content.repository'
import { IYoutubeContentRepository } from './youtube-content.repository'
import { INotificationRepository } from './notification.repository'
import { ITuitionPaymentRepository } from './tuition-payment.repository'
import { IExamImportSessionRepository } from './exam-import-session.repository'
import { ITempExamRepository } from './temp-exam.repository'
import { ITempSectionRepository } from './temp-section.repository'
import { ITempQuestionRepository } from './temp-question.repository'
import { ITempStatementRepository } from './temp-statement.repository'
import { ITempQuestionChapterRepository } from './temp-question-chapter.repository'
import { IMediaUsageRepository } from './media-usage.repository'
import { IExamRepository } from './exam.repository'
import { ISectionRepository } from './section.repository'
import { IQuestionRepository } from './question.repository'
import { IStatementRepository } from './statement.repository'
import { IQuestionExamRepository } from './question-exam.repository'
import { IQuestionChapterRepository } from './question-chapter.repository'
// src/domain/repositories/unit-of-work.repository.ts
export interface UnitOfWorkRepos {
  userRepository: IUserRepository
  adminRepository: IAdminRepository
  studentRepository: IStudentRepository
  userRefreshTokenRepository: IUserRefreshTokenRepository
  roleRepository: IRoleRepository
  permissionRepository: IPermissionRepository
  adminAuditLogRepository: IAdminAuditLogRepository
  mediaRepository: IMediaRepository
  subjectRepository: ISubjectRepository
  chapterRepository: IChapterRepository
  attendanceRepository: IAttendanceRepository
  classSessionRepository: IClassSessionRepository
  classStudentRepository: IClassStudentRepository
  courseRepository: ICourseRepository
  courseClassRepository: ICourseClassRepository
  courseEnrollmentRepository: ICourseEnrollmentRepository
  learningItemRepository: ILearningItemRepository
  lessonLearningItemRepository: ILessonLearningItemRepository
  documentContentRepository: IDocumentContentRepository
  homeworkContentRepository: IHomeworkContentRepository
  homeworkSubmitRepository: IHomeworkSubmitRepository
  videoContentRepository: IVideoContentRepository
  youtubeContentRepository: IYoutubeContentRepository
  notificationRepository: INotificationRepository
  tuitionPaymentRepository: ITuitionPaymentRepository
  examImportSessionRepository: IExamImportSessionRepository
  tempExamRepository: ITempExamRepository
  tempSectionRepository: ITempSectionRepository
  tempQuestionRepository: ITempQuestionRepository
  tempStatementRepository: ITempStatementRepository
  tempQuestionChapterRepository: ITempQuestionChapterRepository
  mediaUsageRepository: IMediaUsageRepository
  examRepository: IExamRepository
  sectionRepository: ISectionRepository
  questionRepository: IQuestionRepository
  statementRepository: IStatementRepository
  questionExamRepository: IQuestionExamRepository
  questionChapterRepository: IQuestionChapterRepository
}

export interface IUnitOfWork {
  executeInTransaction<T>(
    work: (repos: UnitOfWorkRepos) => Promise<T>,
    options?: { isolationLevel?: import('@prisma/client').Prisma.TransactionIsolationLevel },
  ): Promise<T>
}
