import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftAssignmentResponseDto, AssistantShiftDateRangeQueryDto, AssistantShiftRangeDto, AssistantShiftResponseDto, AssistantShiftSeriesResponseDto, BaseResponseDto, CopyAssistantShiftsDto, CreateAssistantShiftAssignmentDto, CreateAssistantShiftDto, CreateAssistantShiftSeriesDto, SetAssistantShiftSelfRegistrationWindowDto, UpdateAssistantShiftAssignmentDto, UpdateAssistantShiftDto, UpdateAssistantShiftSeriesDto } from '../../dtos'
import type { IMediaUsageRepository, IUnitOfWork } from '../../../domain/repositories'
import { AssistantShiftAssignmentAttendanceStatus, MediaStatus } from '../../../shared/enums'
import { MinioService } from '../../interfaces'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { USER_MEDIA_FIELDS } from '../../../shared/constants'
import { BusinessLogicException, ConflictException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'

const details = { includeSeries: true, includeAssignmentsWithAdmin: true, includeCourseClass: true }
const AVATAR_URL_EXPIRY_SECONDS = 3600 * 24

async function attachAssistantAvatarUrls(
  shifts: AssistantShiftResponseDto[],
  mediaUsageRepository: IMediaUsageRepository,
  minioService: MinioService,
): Promise<void> {
  const assignments = shifts.flatMap((shift) => shift.assignments ?? [])
  const userIds = [...new Set(assignments.map((assignment) => assignment.admin?.userId).filter((id): id is number => id !== undefined))]
  if (userIds.length === 0) return

  const usages = await mediaUsageRepository.findByEntities(EntityType.USER, userIds, USER_MEDIA_FIELDS.AVATAR)
  const avatarMediaByUserId = new Map<number, (typeof usages)[number]['media']>()
  for (const usage of usages) {
    const media = usage.media
    if (media && media.status === MediaStatus.READY && !avatarMediaByUserId.has(usage.entityId)) avatarMediaByUserId.set(usage.entityId, media)
  }

  const avatarUrlByUserId = new Map<number, string>()
  await Promise.all([...avatarMediaByUserId].map(async ([userId, media]) => {
    if (!media) return
    try { avatarUrlByUserId.set(userId, await minioService.getPresignedUrl(media.bucketName, media.objectKey, AVATAR_URL_EXPIRY_SECONDS)) } catch { /* Avatar is optional. */ }
  }))
  for (const assignment of assignments) if (assignment.admin) assignment.admin.avatarUrl = avatarUrlByUserId.get(assignment.admin.userId)
}
function assertRange(startAt: Date, endAt: Date) { if (endAt <= startAt) throw new BusinessLogicException('Thời gian kết thúc phải sau thời gian bắt đầu') }

@Injectable() export class GetAvailableAssistantShiftSeriesUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute() { const data = await this.uow.executeInTransaction((r) => r.assistantShiftSeriesRepository.findAll({ isLocked: false })); return BaseResponseDto.success('Lấy danh sách chuỗi ca thành công', data.map((x) => new AssistantShiftSeriesResponseDto(x))) } }
@Injectable() export class GetAllAssistantShiftSeriesUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute() { const data = await this.uow.executeInTransaction((r) => r.assistantShiftSeriesRepository.findAll()); return BaseResponseDto.success('Lấy tất cả chuỗi ca thành công', data.map((x) => new AssistantShiftSeriesResponseDto(x))) } }

abstract class AssistantShiftListBase { constructor(protected readonly uow: IUnitOfWork, protected readonly mediaUsageRepository: IMediaUsageRepository, protected readonly minioService: MinioService) {} protected async list(seriesId: number, query: AssistantShiftDateRangeQueryDto, onlyUnlocked: boolean) { const range = query.toRange(); if (range.startAtFrom > range.startAtTo) throw new BusinessLogicException('Khoảng thời gian không hợp lệ'); const data = await this.uow.executeInTransaction(async (r) => { const series = await r.assistantShiftSeriesRepository.findById(seriesId); if (!series) throw new NotFoundException('Chuỗi ca không tồn tại'); if (onlyUnlocked && series.isLocked) return []; return r.assistantShiftRepository.findAll({ assistantShiftSeriesId: seriesId, ...range, onlyUnlocked, ...details }) }); const response = data.map((x) => new AssistantShiftResponseDto(x)); await attachAssistantAvatarUrls(response, this.mediaUsageRepository, this.minioService); return BaseResponseDto.success('Lấy danh sách ca thành công', response) } }
@Injectable() export class GetAvailableAssistantShiftsBySeriesUseCase extends AssistantShiftListBase { constructor(@Inject('UNIT_OF_WORK') uow: IUnitOfWork, @Inject('IMediaUsageRepository') mediaUsageRepository: IMediaUsageRepository, minioService: MinioService) { super(uow, mediaUsageRepository, minioService) } execute(id: number, query: AssistantShiftDateRangeQueryDto) { return this.list(id, query, true) } }
@Injectable() export class GetAllAssistantShiftsBySeriesUseCase extends AssistantShiftListBase { constructor(@Inject('UNIT_OF_WORK') uow: IUnitOfWork, @Inject('IMediaUsageRepository') mediaUsageRepository: IMediaUsageRepository, minioService: MinioService) { super(uow, mediaUsageRepository, minioService) } execute(id: number, query: AssistantShiftDateRangeQueryDto) { return this.list(id, query, false) } }

abstract class AssistantShiftDetailBase { constructor(protected readonly uow: IUnitOfWork, protected readonly mediaUsageRepository: IMediaUsageRepository, protected readonly minioService: MinioService) {} protected async get(id: number, onlyUnlocked: boolean) { const shift = await this.uow.executeInTransaction((r) => r.assistantShiftRepository.findById(id, details)); if (!shift) throw new NotFoundException('Ca trợ giảng không tồn tại'); if (onlyUnlocked && (shift.isLocked || shift.series?.isLocked)) throw new NotFoundException('Ca trợ giảng không tồn tại'); const response = new AssistantShiftResponseDto(shift); await attachAssistantAvatarUrls([response], this.mediaUsageRepository, this.minioService); return BaseResponseDto.success('Lấy chi tiết ca thành công', response) } }
@Injectable() export class GetAvailableAssistantShiftUseCase extends AssistantShiftDetailBase { constructor(@Inject('UNIT_OF_WORK') uow: IUnitOfWork, @Inject('IMediaUsageRepository') mediaUsageRepository: IMediaUsageRepository, minioService: MinioService) { super(uow, mediaUsageRepository, minioService) } execute(id: number) { return this.get(id, true) } }
@Injectable() export class GetAssistantShiftUseCase extends AssistantShiftDetailBase { constructor(@Inject('UNIT_OF_WORK') uow: IUnitOfWork, @Inject('IMediaUsageRepository') mediaUsageRepository: IMediaUsageRepository, minioService: MinioService) { super(uow, mediaUsageRepository, minioService) } execute(id: number) { return this.get(id, false) } }

@Injectable() export class CreateAssistantShiftSeriesUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(dto: CreateAssistantShiftSeriesDto) { const item = await this.uow.executeInTransaction((r) => r.assistantShiftSeriesRepository.create(dto)); return BaseResponseDto.success('Tạo chuỗi ca thành công', new AssistantShiftSeriesResponseDto(item)) } }
@Injectable() export class UpdateAssistantShiftSeriesUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(id: number, dto: UpdateAssistantShiftSeriesDto) { const item = await this.uow.executeInTransaction(async (r) => { if (!await r.assistantShiftSeriesRepository.findById(id)) throw new NotFoundException('Chuỗi ca không tồn tại'); return r.assistantShiftSeriesRepository.update(id, dto) }); return BaseResponseDto.success('Cập nhật chuỗi ca thành công', new AssistantShiftSeriesResponseDto(item)) } }
@Injectable() export class DeleteAssistantShiftSeriesUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(id: number) { await this.uow.executeInTransaction(async (r) => { if (!await r.assistantShiftSeriesRepository.findById(id)) throw new NotFoundException('Chuỗi ca không tồn tại'); await r.assistantShiftSeriesRepository.delete(id) }); return BaseResponseDto.success('Xóa chuỗi ca thành công', { deleted: true }) } }

@Injectable() export class CreateAssistantShiftUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(dto: CreateAssistantShiftDto) { const item = await this.uow.executeInTransaction(async (r) => { if (!await r.assistantShiftSeriesRepository.findById(dto.assistantShiftSeriesId)) throw new NotFoundException('Chuỗi ca không tồn tại'); const startAt = new Date(dto.startAt), endAt = new Date(dto.endAt); assertRange(startAt, endAt); return r.assistantShiftRepository.create({ ...dto, startAt, endAt, selfRegistrationOpenAt: dto.selfRegistrationOpenAt ? new Date(dto.selfRegistrationOpenAt) : null, selfRegistrationCloseAt: dto.selfRegistrationCloseAt ? new Date(dto.selfRegistrationCloseAt) : null }) }); return BaseResponseDto.success('Tạo ca thành công', new AssistantShiftResponseDto(item)) } }
@Injectable() export class UpdateAssistantShiftUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(id: number, dto: UpdateAssistantShiftDto) { const item = await this.uow.executeInTransaction(async (r) => { const current = await r.assistantShiftRepository.findById(id); if (!current) throw new NotFoundException('Ca trợ giảng không tồn tại'); if (dto.assistantShiftSeriesId && !await r.assistantShiftSeriesRepository.findById(dto.assistantShiftSeriesId)) throw new NotFoundException('Chuỗi ca không tồn tại'); const startAt = dto.startAt ? new Date(dto.startAt) : current.startAt, endAt = dto.endAt ? new Date(dto.endAt) : current.endAt; assertRange(startAt, endAt); return r.assistantShiftRepository.update(id, { ...dto, startAt, endAt, selfRegistrationOpenAt: dto.selfRegistrationOpenAt ? new Date(dto.selfRegistrationOpenAt) : undefined, selfRegistrationCloseAt: dto.selfRegistrationCloseAt ? new Date(dto.selfRegistrationCloseAt) : undefined }) }); return BaseResponseDto.success('Cập nhật ca thành công', new AssistantShiftResponseDto(item)) } }
@Injectable() export class DeleteAssistantShiftUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(id: number) { await this.uow.executeInTransaction(async (r) => { if (!await r.assistantShiftRepository.findById(id)) throw new NotFoundException('Ca trợ giảng không tồn tại'); await r.assistantShiftRepository.delete(id) }); return BaseResponseDto.success('Xóa ca thành công', { deleted: true }) } }

@Injectable() export class RegisterAssistantShiftUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(shiftId: number, adminId: number) { const item = await this.uow.executeInTransaction(async (r) => { const shift = await r.assistantShiftRepository.findById(shiftId, { includeSeries: true }); if (!shift || shift.isLocked || shift.series?.isLocked) throw new NotFoundException('Ca trợ giảng không tồn tại'); const now = new Date(); if (!shift.selfRegistrationOpenAt || !shift.selfRegistrationCloseAt || now < shift.selfRegistrationOpenAt || now > shift.selfRegistrationCloseAt) throw new BusinessLogicException('Ca chưa trong thời gian tự đăng ký'); if (await r.assistantShiftAssignmentRepository.findById(shiftId, adminId)) throw new ConflictException('Bạn đã đăng ký ca này'); return r.assistantShiftAssignmentRepository.create({ assistantShiftId: shiftId, adminId }) }); return BaseResponseDto.success('Đăng ký ca thành công', new AssistantShiftAssignmentResponseDto(item)) } }
@Injectable() export class CancelAssistantShiftRegistrationUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(shiftId: number, adminId: number) { await this.uow.executeInTransaction(async (r) => { const shift = await r.assistantShiftRepository.findById(shiftId, { includeSeries: true }); if (!shift || shift.isLocked || shift.series?.isLocked) throw new NotFoundException('Ca trợ giảng không tồn tại'); const now = new Date(); if (!shift.selfRegistrationOpenAt || !shift.selfRegistrationCloseAt || now < shift.selfRegistrationOpenAt || now > shift.selfRegistrationCloseAt) throw new BusinessLogicException('Ca chưa trong thời gian tự đăng ký'); if (!await r.assistantShiftAssignmentRepository.findById(shiftId, adminId)) throw new NotFoundException('Bạn chưa đăng ký ca này'); await r.assistantShiftAssignmentRepository.delete(shiftId, adminId) }); return BaseResponseDto.success('Hủy đăng ký ca thành công', { cancelled: true }) } }

@Injectable() export class CreateAssistantShiftAssignmentUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(shiftId: number, dto: CreateAssistantShiftAssignmentDto) { const item = await this.uow.executeInTransaction(async (r) => { if (!await r.assistantShiftRepository.findById(shiftId)) throw new NotFoundException('Ca trợ giảng không tồn tại'); if (!await r.adminRepository.findById(dto.adminId)) throw new NotFoundException('Trợ giảng không tồn tại'); return r.assistantShiftAssignmentRepository.create({ assistantShiftId: shiftId, ...dto }) }); return BaseResponseDto.success('Phân công trợ giảng thành công', new AssistantShiftAssignmentResponseDto(item)) } }
@Injectable() export class UpdateAssistantShiftAssignmentUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(shiftId: number, adminId: number, dto: UpdateAssistantShiftAssignmentDto) { const item = await this.uow.executeInTransaction(async (r) => { if (!await r.assistantShiftAssignmentRepository.findById(shiftId, adminId)) throw new NotFoundException('Phân công không tồn tại'); return r.assistantShiftAssignmentRepository.update(shiftId, adminId, dto) }); return BaseResponseDto.success('Cập nhật phân công thành công', new AssistantShiftAssignmentResponseDto(item)) } }
@Injectable() export class DeleteAssistantShiftAssignmentUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(shiftId: number, adminId: number) { await this.uow.executeInTransaction(async (r) => { if (!await r.assistantShiftAssignmentRepository.findById(shiftId, adminId)) throw new NotFoundException('Phân công không tồn tại'); await r.assistantShiftAssignmentRepository.delete(shiftId, adminId) }); return BaseResponseDto.success('Xóa phân công thành công', { deleted: true }) } }
@Injectable() export class CheckInAssistantShiftUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(shiftId: number, adminId: number) { const item = await this.uow.executeInTransaction(async (r) => { const shift = await r.assistantShiftRepository.findById(shiftId); if (!shift) throw new NotFoundException('Ca trợ giảng không tồn tại'); const now = new Date(), openAt = new Date(shift.startAt.getTime() - 45 * 60 * 1000); if (now < openAt || now > shift.endAt) throw new BusinessLogicException('Chỉ được chấm công từ 45 phút trước giờ bắt đầu đến trước khi ca kết thúc'); if (!await r.assistantShiftAssignmentRepository.findById(shiftId, adminId)) throw new NotFoundException('Bạn chưa được phân công vào ca này'); return r.assistantShiftAssignmentRepository.update(shiftId, adminId, { attendanceStatus: AssistantShiftAssignmentAttendanceStatus.PRESENT }) }); return BaseResponseDto.success('Chấm công thành công', new AssistantShiftAssignmentResponseDto(item)) } }

function toDateRange(dto: AssistantShiftRangeDto): { startAt: Date; endAt: Date } {
  const startAt = new Date(dto.startAt)
  const endAt = new Date(dto.endAt)
  assertRange(startAt, endAt)
  return { startAt, endAt }
}

@Injectable()
export class CopyAssistantShiftsBySeriesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(seriesId: number, dto: CopyAssistantShiftsDto) {
    const copyStartAt = new Date(dto.startCopyAt)
    const copyEndAt = new Date(dto.endCopyAt)
    const pasteStartAt = new Date(dto.startPasteAt)
    const pasteEndAt = new Date(dto.endPasteAt)
    assertRange(copyStartAt, copyEndAt)
    assertRange(pasteStartAt, pasteEndAt)

    if (copyEndAt.getTime() - copyStartAt.getTime() !== pasteEndAt.getTime() - pasteStartAt.getTime()) {
      throw new BusinessLogicException('Khoảng thời gian sao chép và dán phải có cùng độ dài')
    }

    const copyAssignments = dto.copyAssignments ?? true
    const offsetMilliseconds = pasteStartAt.getTime() - copyStartAt.getTime()
    const result = await this.uow.executeInTransaction(async (r) => {
      const series = await r.assistantShiftSeriesRepository.findById(seriesId)
      if (!series) throw new NotFoundException('Chuỗi ca không tồn tại')

      const sourceShifts = await r.assistantShiftRepository.findAll({
        assistantShiftSeriesId: seriesId,
        startAtFrom: copyStartAt,
        startAtTo: copyEndAt,
        includeAssignmentsWithAdmin: copyAssignments,
      })
      if (sourceShifts.length === 0) throw new NotFoundException('Không có ca nào trong khoảng thời gian sao chép')
      if (sourceShifts.some((shift) => shift.endAt > copyEndAt)) {
        throw new BusinessLogicException('Tất cả ca sao chép phải kết thúc trong khoảng thời gian sao chép')
      }
      if (await r.assistantShiftRepository.hasOverlappingTimeRange(seriesId, pasteStartAt, pasteEndAt)) {
        throw new ConflictException('Khoảng thời gian dán đã có ca trợ giảng')
      }

      let copiedAssignmentCount = 0
      for (const sourceShift of sourceShifts) {
        const copiedShift = await r.assistantShiftRepository.create({
          assistantShiftSeriesId: seriesId,
          classId: sourceShift.classId ?? null,
          name: sourceShift.name,
          notes: null,
          startAt: new Date(sourceShift.startAt.getTime() + offsetMilliseconds),
          endAt: new Date(sourceShift.endAt.getTime() + offsetMilliseconds),
          isLocked: sourceShift.isLocked,
          selfRegistrationOpenAt: sourceShift.selfRegistrationOpenAt
            ? new Date(sourceShift.selfRegistrationOpenAt.getTime() + offsetMilliseconds)
            : null,
          selfRegistrationCloseAt: sourceShift.selfRegistrationCloseAt
            ? new Date(sourceShift.selfRegistrationCloseAt.getTime() + offsetMilliseconds)
            : null,
          requiredAssistantCount: sourceShift.requiredAssistantCount,
        })

        if (copyAssignments) {
          for (const assignment of sourceShift.assignments ?? []) {
            await r.assistantShiftAssignmentRepository.create({
              assistantShiftId: copiedShift.assistantShiftId,
              adminId: assignment.adminId,
              attendanceStatus: AssistantShiftAssignmentAttendanceStatus.PENDING,
              absenceReason: null,
              managerNote: null,
            })
            copiedAssignmentCount += 1
          }
        }
      }

      return { copiedShiftCount: sourceShifts.length, copiedAssignmentCount }
    }, { isolationLevel: 'Serializable' })

    return BaseResponseDto.success('Sao chép ca trợ giảng thành công', result)
  }
}

abstract class UpdateAssistantShiftsBySeriesRangeBase {
  constructor(protected readonly uow: IUnitOfWork) {}

  protected async update(
    seriesId: number,
    dto: AssistantShiftRangeDto,
    data: { isLocked?: boolean; selfRegistrationOpenAt?: Date; selfRegistrationCloseAt?: Date },
  ) {
    const { startAt, endAt } = toDateRange(dto)
    return this.uow.executeInTransaction(async (r) => {
      if (!await r.assistantShiftSeriesRepository.findById(seriesId)) throw new NotFoundException('Chuỗi ca không tồn tại')
      return r.assistantShiftRepository.updateBySeriesAndStartAtRange(seriesId, startAt, endAt, data)
    })
  }
}

@Injectable()
export class LockAssistantShiftsBySeriesUseCase extends UpdateAssistantShiftsBySeriesRangeBase {
  constructor(@Inject('UNIT_OF_WORK') uow: IUnitOfWork) { super(uow) }
  async execute(seriesId: number, dto: AssistantShiftRangeDto) {
    const updatedCount = await this.update(seriesId, dto, { isLocked: true })
    return BaseResponseDto.success('Khóa các ca trợ giảng thành công', { updatedCount })
  }
}

@Injectable()
export class UnlockAssistantShiftsBySeriesUseCase extends UpdateAssistantShiftsBySeriesRangeBase {
  constructor(@Inject('UNIT_OF_WORK') uow: IUnitOfWork) { super(uow) }
  async execute(seriesId: number, dto: AssistantShiftRangeDto) {
    const updatedCount = await this.update(seriesId, dto, { isLocked: false })
    return BaseResponseDto.success('Mở khóa các ca trợ giảng thành công', { updatedCount })
  }
}

@Injectable()
export class SetAssistantShiftSelfRegistrationWindowBySeriesUseCase extends UpdateAssistantShiftsBySeriesRangeBase {
  constructor(@Inject('UNIT_OF_WORK') uow: IUnitOfWork) { super(uow) }
  async execute(seriesId: number, dto: SetAssistantShiftSelfRegistrationWindowDto) {
    const selfRegistrationOpenAt = new Date(dto.selfRegistrationOpenAt)
    const selfRegistrationCloseAt = new Date(dto.selfRegistrationCloseAt)
    assertRange(selfRegistrationOpenAt, selfRegistrationCloseAt)
    const updatedCount = await this.update(seriesId, dto, { selfRegistrationOpenAt, selfRegistrationCloseAt })
    return BaseResponseDto.success('Đặt thời gian tự đăng ký ca thành công', { updatedCount })
  }
}

@Injectable()
export class GetMyAssistantShiftsUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    @Inject('IMediaUsageRepository') private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(adminId: number, query: AssistantShiftDateRangeQueryDto) {
    const range = query.toRange()
    if (range.startAtFrom > range.startAtTo) throw new BusinessLogicException('Khoảng thời gian không hợp lệ')

    const data = await this.uow.executeInTransaction((r) => r.assistantShiftRepository.findAll({
      ...range,
      assignedAdminId: adminId,
      includeAssignmentsForAdminId: adminId,
      includeSeries: true,
      includeCourseClass: true,
    }))

    const response = data.map((item) => new AssistantShiftResponseDto(item))
    await attachAssistantAvatarUrls(response, this.mediaUsageRepository, this.minioService)
    return BaseResponseDto.success('Lấy lịch trợ giảng của bạn thành công', response)
  }
}

@Injectable()
export class GetMyAssistantShiftMonthlyStatisticsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(adminId: number) {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const monthEnd = new Date(nextMonthStart.getTime() - 1)
    const shifts = await this.uow.executeInTransaction((r) => r.assistantShiftRepository.findAll({
      assignedAdminId: adminId,
      startAtFrom: monthStart,
      startAtTo: monthEnd,
      includeAssignmentsForAdminId: adminId,
    }))

    let workedShiftCount = 0
    let workedHours = 0
    let absentShiftCount = 0
    let absentHours = 0
    for (const shift of shifts) {
      const attendanceStatus = shift.assignments?.[0]?.attendanceStatus
      const hours = (shift.endAt.getTime() - shift.startAt.getTime()) / (60 * 60 * 1000)
      if (attendanceStatus === AssistantShiftAssignmentAttendanceStatus.PRESENT) {
        workedShiftCount += 1
        workedHours += hours
      } else if (attendanceStatus === AssistantShiftAssignmentAttendanceStatus.ABSENT) {
        absentShiftCount += 1
        absentHours += hours
      }
    }

    return BaseResponseDto.success('Lấy thống kê ca trợ giảng tháng này thành công', {
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      workedShiftCount,
      workedHours: Math.round(workedHours * 100) / 100,
      absentShiftCount,
      absentHours: Math.round(absentHours * 100) / 100,
    })
  }
}
