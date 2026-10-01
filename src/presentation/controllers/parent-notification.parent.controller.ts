import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'

import type { AuthenticatedUser } from '../../application/interfaces'
import {
  BaseResponseDto,
  ParentDeviceResponseDto,
  ParentNotificationSettingsResponseDto,
  ParentNotificationInboxItemDto,
  ParentNotificationInboxQueryDto,
  ParentNotificationStatsResponseDto,
  RegisterParentDeviceDto,
  UpdateParentNotificationPreferencesDto,
  UpdateUserNotificationEnabledDto,
} from '../../application/dtos'
import {
  GetParentNotificationSettingsUseCase,
  GetParentNotificationStatsUseCase,
  GetParentNotificationUseCase,
  GetParentNotificationsUseCase,
  MarkParentNotificationReadUseCase,
  RegisterParentDeviceUseCase,
  UnregisterParentDeviceUseCase,
  UpdateParentNotificationPreferencesUseCase,
  UpdateUserNotificationEnabledUseCase,
} from '../../application/use-cases/parent-notification'
import { CursorPageResponseDto } from '../../application/dtos/pagination/cursor-page-response.dto'
import { AuthOnly, CurrentUser } from '../../shared/decorators'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('parent')
export class ParentNotificationController {
  constructor(
    private readonly registerParentDeviceUseCase: RegisterParentDeviceUseCase,
    private readonly unregisterParentDeviceUseCase: UnregisterParentDeviceUseCase,
    private readonly getParentNotificationSettingsUseCase: GetParentNotificationSettingsUseCase,
    private readonly updateUserNotificationEnabledUseCase: UpdateUserNotificationEnabledUseCase,
    private readonly updateParentNotificationPreferencesUseCase: UpdateParentNotificationPreferencesUseCase,
    private readonly getParentNotificationsUseCase: GetParentNotificationsUseCase,
    private readonly getParentNotificationStatsUseCase: GetParentNotificationStatsUseCase,
    private readonly getParentNotificationUseCase: GetParentNotificationUseCase,
    private readonly markParentNotificationReadUseCase: MarkParentNotificationReadUseCase,
  ) {}

  @Get('notifications')
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ParentNotificationInboxQueryDto,
  ): Promise<CursorPageResponseDto<ParentNotificationInboxItemDto>> {
    return ExceptionHandler.execute(() => this.getParentNotificationsUseCase.execute(user, query))
  }

  @Get('notifications/stats')
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async getNotificationStats(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<ParentNotificationStatsResponseDto>> {
    return ExceptionHandler.execute(() => this.getParentNotificationStatsUseCase.execute(user))
  }

  @Get('notifications/:notificationId')
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async getNotification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('notificationId', ParseIntPipe) notificationId: number,
  ): Promise<BaseResponseDto<ParentNotificationInboxItemDto>> {
    return ExceptionHandler.execute(() => this.getParentNotificationUseCase.execute(user, notificationId))
  }

  @Put('notifications/:notificationId/read')
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async markNotificationRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('notificationId', ParseIntPipe) notificationId: number,
  ): Promise<BaseResponseDto<ParentNotificationInboxItemDto>> {
    return ExceptionHandler.execute(() => this.markParentNotificationReadUseCase.execute(user, notificationId))
  }

  @Post('devices')
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async registerDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterParentDeviceDto,
  ): Promise<BaseResponseDto<ParentDeviceResponseDto>> {
    return ExceptionHandler.execute(() => this.registerParentDeviceUseCase.execute(user, dto))
  }

  @Delete('devices/:deviceId')
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async unregisterDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deviceId') deviceId: string,
  ): Promise<BaseResponseDto<{ removed: boolean }>> {
    return ExceptionHandler.execute(() => this.unregisterParentDeviceUseCase.execute(user, deviceId))
  }

  @Get('notification-settings')
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async getSettings(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<ParentNotificationSettingsResponseDto>> {
    return ExceptionHandler.execute(() => this.getParentNotificationSettingsUseCase.execute(user))
  }

  @Put('notification-settings/enabled')
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async updateEnabled(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserNotificationEnabledDto,
  ): Promise<BaseResponseDto<ParentNotificationSettingsResponseDto>> {
    return ExceptionHandler.execute(() => this.updateUserNotificationEnabledUseCase.execute(user, dto))
  }

  @Put('notification-settings/preferences')
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateParentNotificationPreferencesDto,
  ): Promise<BaseResponseDto<ParentNotificationSettingsResponseDto>> {
    return ExceptionHandler.execute(() => this.updateParentNotificationPreferencesUseCase.execute(user, dto))
  }
}
