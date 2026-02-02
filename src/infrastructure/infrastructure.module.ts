import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from '../prisma/prisma.module'
import { PrismaService } from '../prisma/prisma.service'
import { MinioModule } from './minio.module'
import {
  PrismaUnitOfWork,
  PrismaUserRepository,
  PrismaRoleRepository,
  PrismaPermissionRepository,
  PrismaStudentRepository,
  PrismaEmailVerificationTokenRepository,
  PrismaAdminRepository,
  PrismaResetPasswordTokenRepository,
  PrismaMediaRepository,
  PrismaAdminLogRepository,
  PrismaMediaFolderRepository,
  PrismaMediaUsageRepository,
  PrismaCourseRepository,
  PrismaCourseClassRepository,
  PrismaLessonRepository,
  PrismaLearningItemRepository,
  PrismaLessonLearningItemRepository,
  PrismaClassSessionRepository,
  PrismaClassStudentRepository,
  PrismaCourseEnrollmentRepository,
  PrismaAttendanceRepository,
  PrismaNotificationRepository,
  PrismaTuitionPaymentRepository,
  PrismaTempExamRepository,
  PrismaTempSectionRepository,
  PrismaTempQuestionRepository,
  PrismaTempStatementRepository,
  PrismaTempQuestionChapterRepository,
  PrismaExamImportSessionRepository,
  PrismaExamRepository,
  PrismaSectionRepository,
  PrismaQuestionRepository,
  PrismaStatementRepository,
  PrismaQuestionExamRepository,
  PrismaQuestionChapterRepository,
} from './repositories'
import {
  PasswordService,
  JwtTokenService,
  TokenHashService,
  TokenService,
  HttpClientService,
  AuthService,
  ResendEmailService,
  // SupabaseStorageService, // Disabled: not using Supabase anymore
  MediaProcessingService,
  ExcelService,
} from './services'
import { ImageExportService } from './services/image-export.service'
import { MistralService } from './services/mistral.service'
import { OpenAIService } from './services/openai.service'
import { ExamSplitService } from './services/exam-split.service'
import { QuestionChapterClassificationService } from './services/question-chapter-classification.service'
import { FileConverterService } from './services/file-converter.service'
import { GoogleAdminStrategy } from './strategies/google-admin.strategy'
import { GoogleStudentStrategy } from './strategies/google-student.strategy'
import jwtConfig from '../config/jwt.config'
import googleOAuthConfig from '../config/google-oauth.config'
import emailConfig from '../config/email.config'
import httpClientConfig from '../config/http-client.config'
import supabaseConfig from '../config/supabase.config'
import mistralConfig from '../config/mistral.config'
import openaiConfig from '../config/openai.config'

@Module({
  imports: [
    PrismaModule,
    MinioModule,
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(googleOAuthConfig),
    ConfigModule.forFeature(emailConfig),
    ConfigModule.forFeature(httpClientConfig),
    ConfigModule.forFeature(mistralConfig),
    ConfigModule.forFeature(openaiConfig),
    // ConfigModule.forFeature(supabaseConfig), // Disabled: not using Supabase anymore
    JwtModule.register({}), // Empty config, sẽ override trong service
  ],
  providers: [
    {
      provide: 'UNIT_OF_WORK',
      useClass: PrismaUnitOfWork,
    },
    {
      provide: 'IUserRepository',
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IAdminRepository',
      useFactory: (prisma: PrismaService) => new PrismaAdminRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IRoleRepository',
      useFactory: (prisma: PrismaService) => new PrismaRoleRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IPermissionRepository',
      useFactory: (prisma: PrismaService) => new PrismaPermissionRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IStudentRepository',
      useFactory: (prisma: PrismaService) => new PrismaStudentRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IEmailVerificationTokenRepository',
      useFactory: (prisma: PrismaService) => new PrismaEmailVerificationTokenRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IPasswordResetTokenRepository',
      useFactory: (prisma: PrismaService) => new PrismaResetPasswordTokenRepository(prisma),
      inject: [PrismaService]
    },
    {
      provide: 'IMediaRepository',
      useFactory: (prisma: PrismaService) => new PrismaMediaRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IMediaFolderRepository',
      useFactory: (prisma: PrismaService) => new PrismaMediaFolderRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IMediaUsageRepository',
      useFactory: (prisma: PrismaService) => new PrismaMediaUsageRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IAdminAuditLogRepository',
      useFactory: (prisma: PrismaService) => new PrismaAdminLogRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'ICourseRepository',
      useFactory: (prisma: PrismaService) => new PrismaCourseRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'ICourseClassRepository',
      useFactory: (prisma: PrismaService) => new PrismaCourseClassRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'ILessonRepository',
      useFactory: (prisma: PrismaService) => new PrismaLessonRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'ILearningItemRepository',
      useFactory: (prisma: PrismaService) => new PrismaLearningItemRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'ILessonLearningItemRepository',
      useFactory: (prisma: PrismaService) => new PrismaLessonLearningItemRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IClassSessionRepository',
      useFactory: (prisma: PrismaService) => new PrismaClassSessionRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IClassStudentRepository',
      useFactory: (prisma: PrismaService) => new PrismaClassStudentRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'ICourseEnrollmentRepository',
      useFactory: (prisma: PrismaService) => new PrismaCourseEnrollmentRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IAttendanceRepository',
      useFactory: (prisma: PrismaService) => new PrismaAttendanceRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'INotificationRepository',
      useFactory: (prisma: PrismaService) => new PrismaNotificationRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'ITuitionPaymentRepository',
      useFactory: (prisma: PrismaService) => new PrismaTuitionPaymentRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'ITempExamRepository',
      useFactory: (prisma: PrismaService) => new PrismaTempExamRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'ITempSectionRepository',
      useFactory: (prisma: PrismaService) => new PrismaTempSectionRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'ITempQuestionRepository',
      useFactory: (prisma: PrismaService) => new PrismaTempQuestionRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'ITempStatementRepository',
      useFactory: (prisma: PrismaService) => new PrismaTempStatementRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'ITempQuestionChapterRepository',
      useFactory: (prisma: PrismaService) => new PrismaTempQuestionChapterRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IExamImportSessionRepository',
      useFactory: (prisma: PrismaService) => new PrismaExamImportSessionRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IExamRepository',
      useFactory: (prisma: PrismaService) => new PrismaExamRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'ISectionRepository',
      useFactory: (prisma: PrismaService) => new PrismaSectionRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IQuestionRepository',
      useFactory: (prisma: PrismaService) => new PrismaQuestionRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IStatementRepository',
      useFactory: (prisma: PrismaService) => new PrismaStatementRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IQuestionExamRepository',
      useFactory: (prisma: PrismaService) => new PrismaQuestionExamRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IQuestionChapterRepository',
      useFactory: (prisma: PrismaService) => new PrismaQuestionChapterRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'PASSWORD_SERVICE',
      useClass: PasswordService,
    },
    {
      provide: 'JWT_TOKEN_SERVICE',
      useClass: JwtTokenService,
    },
    {
      provide: 'TOKEN_HASH_SERVICE',
      useClass: TokenHashService,
    },
    TokenService,
    {
      provide: 'HTTP_CLIENT_SERVICE',
      useClass: HttpClientService,
    },
    {
      provide: 'AUTH_SERVICE',
      useClass: AuthService,
    },
    {
      provide: 'IEmailService',
      useClass: ResendEmailService,
    },
    // {
    //   provide: 'IStorageService',
    //   useClass: SupabaseStorageService, // Disabled: not using Supabase anymore
    // },
    MediaProcessingService,
    ExcelService,
    MistralService,
    OpenAIService,
    ExamSplitService,
    QuestionChapterClassificationService,
    FileConverterService,
    GoogleAdminStrategy,
    GoogleStudentStrategy,
    ImageExportService,
  ],
  exports: [
    'UNIT_OF_WORK',
    'IUserRepository',
    'IAdminRepository',
    'IRoleRepository',
    'IPermissionRepository',
    'IClassStudentRepository',
    'ICourseEnrollmentRepository',
    'IAttendanceRepository',
    'INotificationRepository',
    'IAdminAuditLogRepository',
    'IStudentRepository',
    'IEmailVerificationTokenRepository',
    'IPasswordResetTokenRepository',
    'IMediaRepository',
    'IMediaFolderRepository',
    'IMediaUsageRepository',
    'ICourseRepository',
    'ICourseClassRepository',
    'ILessonRepository',
    'ILearningItemRepository',
    'ILessonLearningItemRepository',
    'IClassSessionRepository',
    'ITuitionPaymentRepository',
    'ITempExamRepository',
    'ITempSectionRepository',
    'ITempQuestionRepository',
    'ITempStatementRepository',
    'ITempQuestionChapterRepository',
    'IExamImportSessionRepository',
    'IExamRepository',
    'ISectionRepository',
    'IQuestionRepository',
    'IStatementRepository',
    'IQuestionExamRepository',
    'IQuestionChapterRepository',
    'PASSWORD_SERVICE',
    'JWT_TOKEN_SERVICE',
    'TOKEN_HASH_SERVICE',
    TokenService,
    'HTTP_CLIENT_SERVICE',
    'AUTH_SERVICE',
    'IEmailService',
    // 'IStorageService', // Disabled: not using Supabase anymore
    MediaProcessingService,
    ExcelService,
    MistralService,
    OpenAIService,
    ExamSplitService,
    QuestionChapterClassificationService,
    FileConverterService,
    ImageExportService,
  ],
})

export class InfrastructureModule { }
