import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
} from '@nestjs/common'
import {
    GetAllAdminUseCase,
    GetAdminByIdUseCase,
    RegisterAdminUseCase,
    SearchAdminUseCase,
} from '../../application/use-cases'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { AdminListQueryDto, AdminResponseDto, BaseResponseDto, PaginationResponseDto, RegisterAdminDto, RegisterAdminResponseDto } from 'src/application/dtos'
import { AdminSearchQueryDto } from 'src/application/dtos/admin/admin-search-query.dto'
import { Injectable } from '@nestjs/common'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'

@Injectable()
@Controller('admins')
export class AdminController {
    constructor(
        private readonly getAllAdminUseCase: GetAllAdminUseCase,
        private readonly getAdminByIdUseCase: GetAdminByIdUseCase,
        private readonly registerAdminUseCase: RegisterAdminUseCase,
        private readonly searchAdminUseCase: SearchAdminUseCase,
    ) { }

    /**
     * Get all admins with pagination and filters
     * GET /admin
     */
    @Get()
    @RequirePermission(PERMISSION_CODES.ADMIN.GET_ALL)
    @HttpCode(HttpStatus.OK)
    async getAllAdmins(
        @Query() query: AdminListQueryDto,
    ): Promise<PaginationResponseDto<AdminResponseDto>> {
        return ExceptionHandler.execute(() => {
            return this.getAllAdminUseCase.execute(query)
        })
    }

    /**
     * Search admins
     * GET /admins/search
     */
    @Get('search')
    @RequirePermission(PERMISSION_CODES.ADMIN.SEARCH)
    @HttpCode(HttpStatus.OK)
    async searchAdmins(
        @Query() query: AdminSearchQueryDto,
    ): Promise<PaginationResponseDto<AdminResponseDto>> {
        return ExceptionHandler.execute(() => {
            return this.searchAdminUseCase.execute(query)
        })
    }

    /**
     * Get admin profile
     */
    @Get(':id')
    @RequirePermission(PERMISSION_CODES.ADMIN.GET_BY_ID)
    @HttpCode(HttpStatus.OK)
    async getAdminById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseResponseDto<AdminResponseDto>> {
        // Implementation for getting admin by ID goes here
        return ExceptionHandler.execute(() => {
            // Placeholder return statement
            return this.getAdminByIdUseCase.execute(id)
        })
    }

    /**
     * Post admin
     */
    @Post()
    @RequirePermission(PERMISSION_CODES.ADMIN.CREATE)
    @HttpCode(HttpStatus.CREATED)
    async createAdmin(
        @Body() dto: RegisterAdminDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<RegisterAdminResponseDto> {
        // Implementation for creating admin goes here
        return ExceptionHandler.execute(() => {
            // Placeholder return statement
            return this.registerAdminUseCase.execute(dto, adminId) // Replace with actual create logic
        })
    }

}