import { Module } from '@nestjs/common'
import * as attendanceUseCases from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { NotificationApplicationModule } from '../notification/notification.application.module'
import { StudentPointService } from 'src/application/services/student-point.service'
import { AttendanceMakeupLinkService } from 'src/application/services/attendance-makeup-link.service'
import { AttendanceNotificationService } from 'src/application/services/attendance-notification.service'

const ATTENDANCE_USE_CASES = [
  attendanceUseCases.CreateAttendanceUseCase,
  attendanceUseCases.GetAttendanceByIdUseCase,
  attendanceUseCases.UpdateAttendanceUseCase,
  attendanceUseCases.DeleteAttendanceUseCase,
  attendanceUseCases.CreateBulkAttendanceBySessionUseCase,
  attendanceUseCases.ExportAttendanceBySessionUseCase,
  attendanceUseCases.GetAttendanceImageDataUseCase,
  attendanceUseCases.ExportAttendanceImageUseCase,
  attendanceUseCases.SendAttendanceToParentUseCase,
  attendanceUseCases.SendBulkAttendanceToParentUseCase,
  attendanceUseCases.GetAllAttendanceUseCase,
  attendanceUseCases.GetAttendanceStatisticsBySessionUseCase,
  attendanceUseCases.UpdateAttendanceUseCase,
  attendanceUseCases.ToggleParentNotifiedUseCase,
  attendanceUseCases.CheckInAttendanceUseCase,
  attendanceUseCases.CancelCheckInAttendanceUseCase,
  attendanceUseCases.SendSessionAttendanceNotificationsUseCase,
  StudentPointService,
  AttendanceMakeupLinkService,
  AttendanceNotificationService,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
    NotificationApplicationModule, // 🔔 For attendance notifications
  ],
  providers: ATTENDANCE_USE_CASES,
  exports: ATTENDANCE_USE_CASES,
})
export class AttendanceApplicationModule {}
