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
import { GoogleAdminStrategy } from './strategies/google-admin.strategy'
import { GoogleStudentStrategy } from './strategies/google-student.strategy'
import jwtConfig from '../config/jwt.config'
import googleOAuthConfig from '../config/google-oauth.config'
import emailConfig from '../config/email.config'
import httpClientConfig from '../config/http-client.config'
import supabaseConfig from '../config/supabase.config'

@Module({
  imports: [
    PrismaModule,
    MinioModule,
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(googleOAuthConfig),
    ConfigModule.forFeature(emailConfig),
    ConfigModule.forFeature(httpClientConfig),
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
    ImageExportService,
  ],
})

export class InfrastructureModule { }
