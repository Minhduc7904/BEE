import { Injectable, Optional } from '@nestjs/common'
import { studentPointConfig } from 'src/config'
import type { CreateStudentPointLogData, UnitOfWorkRepos } from 'src/domain/repositories'
import { AttendanceStatus, NotificationLevel, NotificationType, PointType } from 'src/shared/enums'
import type { StudentPointLog } from 'src/domain/entities'
import { NotificationRealtimeService } from 'src/application/interfaces'

interface AwardStudentPointsInput {
  studentId: number
  points: number
  source: string
  referenceType: string
  referenceId: number
  note?: string
  metadata?: Record<string, any>
}

interface PointNotificationContent {
  title: string
  message: string
  type: NotificationType
}

@Injectable()
export class StudentPointService {
  constructor(
    @Optional()
    private readonly notificationRealtimeService?: NotificationRealtimeService,
  ) {}

  getCompetitionSubmitPoints(scorePercentage: number): number {
    if (!studentPointConfig.competitionSubmit.enabled) return 0

    const matchedRule = studentPointConfig.competitionSubmit.rules.find(
      (rule) => scorePercentage >= rule.minScorePercentage,
    )

    return matchedRule?.points ?? 0
  }

  async awardCompetitionSubmitPoints(
    repos: UnitOfWorkRepos,
    input: {
      studentId: number
      competitionSubmitId: number
      totalPoints: number
      maxPoints: number
      scorePercentage: number
    },
  ) {
    const points = this.getCompetitionSubmitPoints(input.scorePercentage)

    return this.awardStudentPoints(repos, {
      studentId: input.studentId,
      points,
      source: studentPointConfig.competitionSubmit.source,
      referenceType: studentPointConfig.competitionSubmit.referenceType,
      referenceId: input.competitionSubmitId,
      note: `Awarded ${points} point(s) for competition score ${input.scorePercentage}%.`,
      metadata: {
        totalPoints: input.totalPoints,
        maxPoints: input.maxPoints,
        scorePercentage: input.scorePercentage,
      },
    })
  }

  async awardAttendancePoints(
    repos: UnitOfWorkRepos,
    input: {
      studentId: number
      attendanceId: number
      status: AttendanceStatus | string
      sessionId?: number
    },
  ) {
    const points = this.getAttendancePoints(input.status)

    return this.awardStudentPoints(repos, {
      studentId: input.studentId,
      points,
      source: studentPointConfig.attendance.source,
      referenceType: studentPointConfig.attendance.referenceType,
      referenceId: input.attendanceId,
      note: points > 0 ? `Awarded ${points} point(s) for attendance ${input.status}.` : undefined,
      metadata: {
        attendanceId: input.attendanceId,
        sessionId: input.sessionId,
        status: input.status,
      },
    })
  }

  async removeAttendancePoints(
    repos: UnitOfWorkRepos,
    input: {
      studentId: number
      attendanceId: number
      status?: AttendanceStatus | string
      sessionId?: number
    },
  ) {
    return this.awardStudentPoints(repos, {
      studentId: input.studentId,
      points: 0,
      source: studentPointConfig.attendance.source,
      referenceType: studentPointConfig.attendance.referenceType,
      referenceId: input.attendanceId,
      metadata: {
        attendanceId: input.attendanceId,
        sessionId: input.sessionId,
        status: input.status,
        removed: true,
      },
    })
  }

  async awardLearningItemLearnedPoints(
    repos: UnitOfWorkRepos,
    input: {
      studentId: number
      learningItemId: number
      learnedAt?: Date | null
    },
  ) {
    const points = studentPointConfig.learningItemLearned.enabled
      ? studentPointConfig.learningItemLearned.points
      : 0

    return this.awardStudentPoints(repos, {
      studentId: input.studentId,
      points,
      source: studentPointConfig.learningItemLearned.source,
      referenceType: studentPointConfig.learningItemLearned.referenceType,
      referenceId: input.learningItemId,
      note: points > 0 ? `Awarded ${points} point(s) for learning item completion.` : undefined,
      metadata: {
        learningItemId: input.learningItemId,
        learnedAt: input.learnedAt?.toISOString() ?? null,
      },
    })
  }

  async createStudentPointLog(
    repos: UnitOfWorkRepos,
    input: CreateStudentPointLogData,
  ): Promise<StudentPointLog> {
    const pointLog = await repos.studentPointLogRepository.createAndApply(input)

    await this.notifyPositivePointDelta(
      repos,
      {
        studentId: input.studentId,
        points: input.points,
        source: input.source,
        referenceType: input.referenceType ?? 'MANUAL',
        referenceId: input.referenceId ?? pointLog.pointLogId,
        note: input.note ?? undefined,
        metadata: input.metadata,
      },
      null,
      pointLog,
    )

    return pointLog
  }

  private getAttendancePoints(status: AttendanceStatus | string): number {
    if (!studentPointConfig.attendance.enabled) return 0

    return studentPointConfig.attendance.eligibleStatuses.includes(String(status))
      ? studentPointConfig.attendance.points
      : 0
  }

  private async awardStudentPoints(repos: UnitOfWorkRepos, input: AwardStudentPointsInput) {
    const cappedPoints = Math.min(input.points, studentPointConfig.defaultPointCapPerAction)
    const existing = await repos.studentPointLogRepository.findByReference(
      input.studentId,
      input.source,
      input.referenceType,
      input.referenceId,
    )

    const pointLog = await repos.studentPointLogRepository.syncByReferenceAndApply({
      studentId: input.studentId,
      type: PointType.BONUS,
      points: cappedPoints,
      source: input.source,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      note: input.note,
      metadata: input.metadata,
    })

    await this.notifyPositivePointDelta(repos, input, existing, pointLog)

    return pointLog
  }

  private async notifyPositivePointDelta(
    repos: UnitOfWorkRepos,
    input: AwardStudentPointsInput,
    previousLog: StudentPointLog | null,
    currentLog: StudentPointLog | null,
  ): Promise<void> {
    if (!currentLog) return

    const previousDelta = previousLog ? this.toSignedPoints(previousLog) : 0
    const currentDelta = this.toSignedPoints(currentLog)
    const awardedPoints = currentDelta - previousDelta

    if (awardedPoints <= 0) return

    const student = await repos.studentRepository.findById(input.studentId)
    if (!student?.userId) return

    const content = this.buildPointNotificationContent(input, awardedPoints)

    const notification = await repos.notificationRepository.create({
      userId: student.userId,
      title: content.title,
      message: content.message,
      type: content.type,
      level: NotificationLevel.SUCCESS,
      data: {
        pointLogId: currentLog.pointLogId,
        studentId: input.studentId,
        points: awardedPoints,
        source: input.source,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        metadata: input.metadata,
      },
    })

    if (this.notificationRealtimeService) {
      const stats = await repos.notificationRepository.getStatsByUserId(student.userId)
      this.notificationRealtimeService.notifyUser(student.userId, notification)
      this.notificationRealtimeService.notifyStatsUpdated(student.userId, {
        total: stats.total,
        unread: stats.unread,
        read: stats.read,
      })
    }
  }

  private toSignedPoints(pointLog: StudentPointLog): number {
    return pointLog.type === PointType.PENALTY ? -pointLog.points : pointLog.points
  }

  private buildPointNotificationContent(
    input: AwardStudentPointsInput,
    awardedPoints: number,
  ): PointNotificationContent {
    const pointText = `${awardedPoints} điểm`

    if (input.source === studentPointConfig.competitionSubmit.source) {
      const totalPoints = input.metadata?.totalPoints
      const maxPoints = input.metadata?.maxPoints
      const scorePercentage = input.metadata?.scorePercentage
      const scoreText = totalPoints !== undefined && maxPoints !== undefined
        ? `${totalPoints}/${maxPoints} điểm`
        : scorePercentage !== undefined
          ? `${scorePercentage}%`
          : 'kết quả tốt'

      return {
        title: 'Chúc mừng bạn được cộng điểm',
        message: `Chúc mừng bạn đã được cộng ${pointText} khi làm bài đạt ${scoreText}.`,
        type: NotificationType.OTHER,
      }
    }

    if (input.source === studentPointConfig.attendance.source) {
      return {
        title: 'Chúc mừng bạn được cộng điểm',
        message: `Chúc mừng bạn đã được cộng ${pointText} khi đi học buổi học.`,
        type: NotificationType.ATTENDANCE,
      }
    }

    if (input.source === studentPointConfig.learningItemLearned.source) {
      return {
        title: 'Chúc mừng bạn được cộng điểm',
        message: `Chúc mừng bạn đã được cộng ${pointText} khi hoàn thành mục học tập.`,
        type: NotificationType.LESSON,
      }
    }

    return {
      title: 'Chúc mừng bạn được cộng điểm',
      message: `Chúc mừng bạn đã được cộng ${pointText}.`,
      type: NotificationType.SYSTEM,
    }
  }
}
