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
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import {
  CreateStudentPointLogDto,
  DeleteStudentPointLogResponseDto,
  StudentPointLogListQueryDto,
  StudentPointLogListResponseDto,
  StudentPointLogMutationResponseDto,
  UpdateStudentPointLogDto,
} from 'src/application/dtos/student/student-point-log.dto'
import {
  CreateStudentPointLogUseCase,
  DeleteStudentPointLogUseCase,
  GetMyStudentPointLogsUseCase,
  GetStudentPointLogsByAdminUseCase,
  UpdateStudentPointLogUseCase,
} from 'src/application/use-cases/studentPointLog'
import { CurrentUser } from 'src/shared/decorators'
import { StudentOnly } from 'src/shared/decorators/permission.decorator'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from 'src/shared/constants/permissions/permission.codes'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'

@Controller('student-point-logs')
export class StudentPointLogController {
  constructor(
    private readonly createStudentPointLogUseCase: CreateStudentPointLogUseCase,
    private readonly getMyStudentPointLogsUseCase: GetMyStudentPointLogsUseCase,
    private readonly getStudentPointLogsByAdminUseCase: GetStudentPointLogsByAdminUseCase,
    private readonly updateStudentPointLogUseCase: UpdateStudentPointLogUseCase,
    private readonly deleteStudentPointLogUseCase: DeleteStudentPointLogUseCase,
  ) {}

  /**
   * Endpoint: GET /student-point-logs/my
   *
   * Muc dich:
   * - Hoc sinh dang dang nhap xem lich su cong/tru diem cua chinh minh.
   * - studentId lay tu JWT, khong nhan studentId tu request de tranh xem du lieu hoc sinh khac.
   *
   * Request:
   * - Headers: Authorization: Bearer <student_access_token>
   * - Query:
   *   - page?: number = 1
   *   - limit?: number = 10
   *   - search?: string, tim theo source/referenceType/note
   *   - type?: BONUS | PENALTY
   *   - source?: string, vi du COMPETITION_SUBMIT | ATTENDANCE | LEARNING_ITEM_LEARNED
   *   - referenceType?: string
   *   - referenceId?: number
   *   - fromDate?: string ISO date
   *   - toDate?: string ISO date
   *   - sortBy?: pointLogId | points | type | source | createdAt
   *   - sortOrder?: asc | desc
   *
   * Response 200:
   * {
   *   success: true,
   *   message: "Lay danh sach log diem thanh cong",
   *   data: [
   *     {
   *       pointLogId: 1,
   *       studentId: 12,
   *       type: "BONUS",
   *       points: 1,
   *       signedPoints: 1,
   *       source: "ATTENDANCE",
   *       referenceType: "ATTENDANCE",
   *       referenceId: 99,
   *       note: "Awarded 1 point(s) for attendance PRESENT.",
   *       metadata: { attendanceId: 99, sessionId: 10, status: "PRESENT" },
   *       createdAt: "2026-07-10T03:00:00.000Z",
   *       student: null
   *     }
   *   ],
   *   meta: { page: 1, limit: 10, total: 1, totalPages: 1, hasPrevious: false, hasNext: false },
   *   totalPoint: 15
   * }
   */
  @Get('my')
  @StudentOnly()
  @HttpCode(HttpStatus.OK)
  async getMyPointLogs(
    @CurrentUser('studentId') studentId: number,
    @Query() query: StudentPointLogListQueryDto,
  ): Promise<StudentPointLogListResponseDto> {
    return ExceptionHandler.execute(() => this.getMyStudentPointLogsUseCase.execute(studentId, query))
  }

  /**
   * Endpoint: GET /student-point-logs/students/:studentId
   *
   * Muc dich:
   * - Admin xem lich su cong/tru diem cua mot hoc sinh.
   *
   * Request:
   * - Headers: Authorization: Bearer <admin_access_token>
   * - Params:
   *   - studentId: number, ID hoc sinh can xem log diem
   * - Query:
   *   - page?: number = 1
   *   - limit?: number = 10
   *   - search?: string
   *   - type?: BONUS | PENALTY
   *   - source?: string
   *   - referenceType?: string
   *   - referenceId?: number
   *   - fromDate?: string ISO date
   *   - toDate?: string ISO date
   *   - sortBy?: pointLogId | points | type | source | createdAt
   *   - sortOrder?: asc | desc
   *
   * Response 200:
   * {
   *   success: true,
   *   message: "Lay danh sach log diem thanh cong",
   *   data: [ { pointLogId, studentId, type, points, signedPoints, source, referenceType, referenceId, note, metadata, createdAt, student } ],
   *   meta: { page, limit, total, totalPages, hasPrevious, hasNext, previousPage, nextPage },
   *   totalPoint: 15
   * }
   */
  @Get('students/:studentId')
  @RequirePermission(PERMISSION_CODES.STUDENT_POINT_LOG.GET_BY_STUDENT)
  @HttpCode(HttpStatus.OK)
  async getStudentPointLogsByAdmin(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: StudentPointLogListQueryDto,
  ): Promise<StudentPointLogListResponseDto> {
    return ExceptionHandler.execute(() => this.getStudentPointLogsByAdminUseCase.execute(studentId, query))
  }

  /**
   * Endpoint: POST /student-point-logs
   *
   * Muc dich:
   * - Admin tao log cong/tru diem thu cong cho hoc sinh.
   * - Backend tu cap nhat students.total_point theo type va points.
   * - Neu type = BONUS thi totalPoint tang points.
   * - Neu type = PENALTY thi totalPoint giam points.
   * - Neu tao log BONUS, backend se tao notification chuc mung cho hoc sinh.
   *
   * Request:
   * - Headers: Authorization: Bearer <admin_access_token>
   * - Body:
   * {
   *   "studentId": 12,
   *   "type": "BONUS",
   *   "points": 1,
   *   "source": "ADMIN_ADJUST",
   *   "referenceType": "MANUAL",
   *   "referenceId": 123,
   *   "note": "Cong diem thuong thu cong",
   *   "metadata": { "reason": "Hoc sinh co thanh tich tot" }
   * }
   *
   * Response 201:
   * {
   *   success: true,
   *   message: "Tao log diem thanh cong",
   *   data: {
   *     pointLog: {
   *       pointLogId: 10,
   *       studentId: 12,
   *       type: "BONUS",
   *       points: 1,
   *       signedPoints: 1,
   *       source: "ADMIN_ADJUST",
   *       referenceType: "MANUAL",
   *       referenceId: 123,
   *       note: "Cong diem thuong thu cong",
   *       metadata: { "reason": "Hoc sinh co thanh tich tot" },
   *       createdAt: "2026-07-10T03:00:00.000Z",
   *       student: { ... }
   *     },
   *     totalPoint: 16
   *   }
   * }
   */
  @Post()
  @RequirePermission(PERMISSION_CODES.STUDENT_POINT_LOG.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createPointLog(
    @Body() dto: CreateStudentPointLogDto,
  ): Promise<BaseResponseDto<StudentPointLogMutationResponseDto>> {
    return ExceptionHandler.execute(() => this.createStudentPointLogUseCase.execute(dto))
  }

  /**
   * Endpoint: PUT /student-point-logs/:pointLogId
   *
   * Muc dich:
   * - Admin cap nhat mot log diem cua hoc sinh.
   * - Neu cap nhat type hoac points, backend tu tinh phan chenh lech va cap nhat lai students.total_point.
   * - Vi du log cu BONUS 1, cap nhat thanh BONUS 2 thi totalPoint +1.
   * - Vi du log cu BONUS 1, cap nhat thanh PENALTY 1 thi totalPoint -2.
   *
   * Request:
   * - Headers: Authorization: Bearer <admin_access_token>
   * - Params:
   *   - pointLogId: number
   * - Body:
   * {
   *   "type": "BONUS",
   *   "points": 2,
   *   "source": "ADMIN_ADJUST",
   *   "referenceType": "MANUAL",
   *   "referenceId": 123,
   *   "note": "Dieu chinh diem thuong",
   *   "metadata": { "reason": "Bo sung diem" }
   * }
   *
   * Response 200:
   * {
   *   success: true,
   *   message: "Cap nhat log diem thanh cong",
   *   data: {
   *     pointLog: { pointLogId, studentId, type, points, signedPoints, source, referenceType, referenceId, note, metadata, createdAt, student },
   *     totalPoint: 16
   *   }
   * }
   */
  @Put(':pointLogId')
  @RequirePermission(PERMISSION_CODES.STUDENT_POINT_LOG.UPDATE)
  @HttpCode(HttpStatus.OK)
  async updatePointLog(
    @Param('pointLogId', ParseIntPipe) pointLogId: number,
    @Body() dto: UpdateStudentPointLogDto,
  ): Promise<BaseResponseDto<StudentPointLogMutationResponseDto>> {
    return ExceptionHandler.execute(() => this.updateStudentPointLogUseCase.execute(pointLogId, dto))
  }

  /**
   * Endpoint: DELETE /student-point-logs/:pointLogId
   *
   * Muc dich:
   * - Admin xoa mot log diem cua hoc sinh.
   * - Backend tu tru/phuc hoi students.total_point theo diem co dau cua log bi xoa.
   * - Vi du xoa log BONUS 1 thi totalPoint -1.
   * - Vi du xoa log PENALTY 1 thi totalPoint +1.
   *
   * Request:
   * - Headers: Authorization: Bearer <admin_access_token>
   * - Params:
   *   - pointLogId: number
   *
   * Response 200:
   * {
   *   success: true,
   *   message: "Xoa log diem thanh cong",
   *   data: {
   *     deleted: true,
   *     deletedPointLog: { pointLogId, studentId, type, points, signedPoints, source, referenceType, referenceId, note, metadata, createdAt, student },
   *     totalPoint: 14
   *   }
   * }
   */
  @Delete(':pointLogId')
  @RequirePermission(PERMISSION_CODES.STUDENT_POINT_LOG.DELETE)
  @HttpCode(HttpStatus.OK)
  async deletePointLog(
    @Param('pointLogId', ParseIntPipe) pointLogId: number,
  ): Promise<BaseResponseDto<DeleteStudentPointLogResponseDto>> {
    return ExceptionHandler.execute(() => this.deleteStudentPointLogUseCase.execute(pointLogId))
  }
}
