import { Controller, Get, Put, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { BaseResponseDto, StudentResponseDto, UpdateStudentDto } from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { AuthOnly, CurrentUser } from '../../shared/decorators'
import { GetStudentProfileUseCase, UpdateStudentProfileUseCase } from '../../application/use-cases'

@Controller('student/profile')
export class ProfileStudentController {
    constructor(
        private readonly getStudentProfileUseCase: GetStudentProfileUseCase,
        private readonly updateStudentProfileUseCase: UpdateStudentProfileUseCase,
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
}
