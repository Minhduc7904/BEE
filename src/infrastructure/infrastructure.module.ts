import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from '../prisma/prisma.module'
import { PrismaService } from '../prisma/prisma.service'
import {
  PrismaUnitOfWork,
  PrismaUserRepository,
  PrismaRoleRepository,
  PrismaStudentRepository,
  PrismaEmailVerificationTokenRepository,
  PrismaImageRepository,
  PrismaDocumentRepository,
  PrismaAdminRepository,
  PrismaQuestionImageRepository,
  PrismaSolutionImageRepository,
  PrismaMediaImageRepository,
  PrismaResetPasswordTokenRepository
} from './repositories'
import {
  PasswordService,
  JwtTokenService,
  TokenHashService,
  TokenService,
  HttpClientService,
  AuthService,
  ResendEmailService,
  SupabaseStorageService
} from './services'
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
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(googleOAuthConfig),
    ConfigModule.forFeature(emailConfig),
    ConfigModule.forFeature(httpClientConfig),
    ConfigModule.forFeature(supabaseConfig),
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
      provide: 'IDocumentRepository',
      useFactory: (prisma: PrismaService) => new PrismaDocumentRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IImageRepository',
      useFactory: (prisma: PrismaService) => new PrismaImageRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IQuestionImageRepository',
      useFactory: (prisma: PrismaService) => new PrismaQuestionImageRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'ISolutionImageRepository',
      useFactory: (prisma: PrismaService) => new PrismaSolutionImageRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'IMediaImageRepository',
      useFactory: (prisma: PrismaService) => new PrismaMediaImageRepository(prisma),
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
    {
      provide: 'IStorageService',
      useClass: SupabaseStorageService,
    },
    GoogleAdminStrategy,
    GoogleStudentStrategy,
  ],
  exports: [
    'UNIT_OF_WORK',
    'IUserRepository',
    'IAdminRepository',
    'IRoleRepository',
    'IStudentRepository',
    'IImageRepository',
    'IQuestionImageRepository',
    'ISolutionImageRepository',
    'IMediaImageRepository',
    'IDocumentRepository',
    'IEmailVerificationTokenRepository',
    'IPasswordResetTokenRepository',
    'PASSWORD_SERVICE',
    'JWT_TOKEN_SERVICE',
    'TOKEN_HASH_SERVICE',
    TokenService,
    'HTTP_CLIENT_SERVICE',
    'AUTH_SERVICE',
    'IEmailService',
    'IStorageService',
  ],
})
export class InfrastructureModule { }
