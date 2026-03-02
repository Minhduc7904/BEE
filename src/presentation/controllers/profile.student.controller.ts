import { Controller, Get, Put, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { BaseResponseDto, StudentResponseDto, UpdateStudentDto } from '../../application/dtos'
import { MediaResponseDto } from '../../application/dtos/media'
import { ChangePasswordDto } from '../../application/dtos/profile/change-password.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { AuthOnly, CurrentUser } from '../../shared/decorators'
import { GetStudentProfileUseCase, UpdateStudentProfileUseCase, UploadStudentAvatarUseCase, ChangeStudentPasswordUseCase } from '../../application/use-cases'

@Controller('student/profile')
export class ProfileStudentController {
    constructor(
        private readonly getStudentProfileUseCase: GetStudentProfileUseCase,
        private readonly updateStudentProfileUseCase: UpdateStudentProfileUseCase,
        private readonly uploadStudentAvatarUseCase: UploadStudentAvatarUseCase,
        private readonly changeStudentPasswordUseCase: ChangeStudentPasswordUseCase,
    ) { }

    /**
     * Get student profile
     * GET /student/profile
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @AuthOnly()
    async getProfile(@CurrentUser('userId') userId: number): Promise<BaseResponseDto<StudentResponseDto>> {
        return ExceptionHandler.execute(() => this.getStudentProfileUseCase.execute(userId))
    }

    /**
     * Update student profile
     * PUT /student/profile
     */
    @Put()
    @HttpCode(HttpStatus.OK)
    @AuthOnly()
    async updateProfile(
        @CurrentUser('userId') userId: number,
        @Body() updateDto: UpdateStudentDto,
    ): Promise<BaseResponseDto<StudentResponseDto>> {
        return ExceptionHandler.execute(() => this.updateStudentProfileUseCase.execute(userId, updateDto))
    }

    /**
     * Upload student avatar
     * POST /student/profile/avatar
     */
    @Post('avatar')
    @HttpCode(HttpStatus.OK)
    @AuthOnly()
    @UseInterceptors(FileInterceptor('file'))
    async uploadAvatar(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser('userId') userId: number,
    ): Promise<BaseResponseDto<MediaResponseDto>> {
        return ExceptionHandler.execute(() => this.uploadStudentAvatarUseCase.execute(file, userId))
    }

    /**
     * Change student password
     * PUT /student/profile/change-password
     */
    @Put('change-password')
    @HttpCode(HttpStatus.OK)
    @AuthOnly()
    async changePassword(
        @CurrentUser('userId') userId: number,
        @Body() dto: ChangePasswordDto,
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.changeStudentPasswordUseCase.execute(userId, dto))
    }
}
