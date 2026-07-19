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
    HardDeleteAdminResult,
    HardDeleteAdminUseCase,
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
        private readonly hardDeleteAdminUseCase: HardDeleteAdminUseCase,
        private readonly registerAdminUseCase: RegisterAdminUseCase,
        private readonly searchAdminUseCase: SearchAdminUseCase,
    ) { }

    /**
     * Get all admins with pagination and filters.
     *
     * Request example:
     *   GET /api/admins?page=1&limit=20&isActive=false&search=nguyen
     *
     * `isActive` filters the related User account. Its value is optional;
     * omitting it returns both active and inactive administrators.
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

    /**
     * Hard delete an admin and their user account.
     *
     * Request:
     *   DELETE /api/admins/42
     *
     * Behaviour:
     * - Requires only `admin:delete`; there is no self-delete, role, or dependency rule.
     * - Deletes avatar media rows and their MinIO files.
     * - Transfers other media uploaded by the deleted admin to adminId 1.
     * - When adminId 1 itself is deleted, regular media becomes unassigned because
     *   the transfer target is also being removed.
     * - Deletes the Admin and User rows in one database transaction.
     *
     * Example response:
     * {
     *   "success": true,
     *   "data": {
     *     "adminId": 42,
     *     "userId": 101,
     *     "transferredMediaCount": 7,
     *     "transferredMediaToAdminId": 1,
     *     "deletedAvatarMediaCount": 1,
     *     "deletedAvatarFilesCount": 1,
     *     "failedAvatarFilesCount": 0,
     *     "avatarFileResults": [{ "mediaId": 9, "status": "deleted" }]
     *   }
     * }
     */
    @Delete(':id')
    @RequirePermission(PERMISSION_CODES.ADMIN.DELETE)
    @HttpCode(HttpStatus.OK)
    async hardDeleteAdmin(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseResponseDto<HardDeleteAdminResult>> {
        return ExceptionHandler.execute(() => this.hardDeleteAdminUseCase.execute(id))
    }

}
