// src/domain/entities/exam/competition.entity.ts

import { Visibility } from '../../../shared/enums'
import { Exam } from './exam.entity'
import { LearningItem } from '../learningItem'
import { HomeworkContent } from '../learningItem/homework-content.entity'
import { Admin } from '../user/admin.entity'

export class Competition {
  // Required properties
  competitionId: number
  title: string
  createdBy: number
  visibility: Visibility
  showResultDetail: boolean
  allowLeaderboard: boolean
  allowViewScore: boolean
  allowViewAnswer: boolean
  enableAntiCheating: boolean
  allowViewSolutionYoutubeUrl: boolean
  allowViewExamContent: boolean
  createdAt: Date
  updatedAt: Date

  // Optional properties
  startDate?: Date | null
  endDate?: Date | null
  examId?: number | null
  subtitle?: string | null
  policies?: string | null
  durationMinutes?: number | null
  maxAttempts?: number | null

  // Relations (optional - sẽ được populate khi cần)
  exam?: Exam | null
  admin?: Admin | null
  learningItems?: LearningItem[] // LearningItem[]
  homeworkContents?: HomeworkContent[] // HomeworkContent[]

  constructor(data: {
    competitionId: number
    title: string
    createdBy: number
    visibility: Visibility
    showResultDetail: boolean
    allowLeaderboard: boolean
    allowViewScore: boolean
    allowViewAnswer: boolean
    enableAntiCheating: boolean
    allowViewSolutionYoutubeUrl: boolean
    allowViewExamContent: boolean
    createdAt: Date
    updatedAt: Date
    startDate?: Date | null
    endDate?: Date | null
    examId?: number | null
    subtitle?: string | null
    policies?: string | null
    durationMinutes?: number | null
    maxAttempts?: number | null
    exam?: Exam | null
    admin?: any
    learningItems?: LearningItem[]
    homeworkContents?: HomeworkContent[]

  }) {
    this.competitionId = data.competitionId
    this.title = data.title
    this.createdBy = data.createdBy
    this.visibility = data.visibility
    this.showResultDetail = data.showResultDetail
    this.allowLeaderboard = data.allowLeaderboard
    this.allowViewScore = data.allowViewScore
    this.allowViewAnswer = data.allowViewAnswer
    this.enableAntiCheating = data.enableAntiCheating
    this.allowViewSolutionYoutubeUrl = data.allowViewSolutionYoutubeUrl
    this.allowViewExamContent = data.allowViewExamContent
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.startDate = data.startDate
    this.endDate = data.endDate
    this.examId = data.examId
    this.subtitle = data.subtitle
    this.policies = data.policies
    this.durationMinutes = data.durationMinutes
    this.maxAttempts = data.maxAttempts
    this.exam = data.exam
    this.admin = data.admin
    this.learningItems = data.learningItems
    this.homeworkContents = data.homeworkContents
  }

  /**
   * Kiểm tra competition có giới hạn thời gian không
   */
  hasTimeLimit(): boolean {
    return this.startDate !== null && this.startDate !== undefined && 
           this.endDate !== null && this.endDate !== undefined
  }

  /**
   * Kiểm tra competition có exam không
   */
  hasExam(): boolean {
    return this.examId !== null && this.examId !== undefined
  }

  /**
   * Kiểm tra competition có subtitle không
   */
  hasSubtitle(): boolean {
    return Boolean(this.subtitle && this.subtitle.trim().length > 0)
  }

  /**
   * Kiểm tra competition có policies không
   */
  hasPolicies(): boolean {
    return Boolean(this.policies && this.policies.trim().length > 0)
  }

  /**
   * Kiểm tra competition có thời lượng không
   */
  hasDuration(): boolean {
    return this.durationMinutes !== null && this.durationMinutes !== undefined
  }

  /**
   * Kiểm tra competition có giới hạn số lần làm không
   */
  hasMaxAttempts(): boolean {
    return this.maxAttempts !== null && this.maxAttempts !== undefined
  }

  /**
   * Kiểm tra competition có learning items không
   */
  hasLearningItems(): boolean {
    return Boolean(this.learningItems && this.learningItems.length > 0)
  }

  /**
   * Lấy tiêu đề hiển thị
   */
  getTitleDisplay(): string {
    return this.title || 'Chưa có tiêu đề'
  }

  /**
   * Lấy subtitle hiển thị
   */
  getSubtitleDisplay(): string {
    return this.subtitle || 'Không có phụ đề'
  }

  /**
   * Lấy thời lượng hiển thị
   */
  getDurationDisplay(): string {
    if (!this.hasDuration()) {
      return 'Không giới hạn'
    }
    const hours = Math.floor(this.durationMinutes! / 60)
    const minutes = this.durationMinutes! % 60
    if (hours > 0) {
      return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`
    }
    return `${minutes} phút`
  }

  /**
   * Lấy số lần làm hiển thị
   */
  getMaxAttemptsDisplay(): string {
    if (!this.hasMaxAttempts()) {
      return 'Không giới hạn'
    }
    return `${this.maxAttempts} lần`
  }

  /**
   * Lấy visibility hiển thị
   */
  getVisibilityDisplay(): string {
    const visibilityMap = {
      [Visibility.DRAFT]: 'Nháp',
      [Visibility.PRIVATE]: 'Riêng tư',
      [Visibility.PUBLISHED]: 'Đã xuất bản',
    }
    return visibilityMap[this.visibility] || 'Không xác định'
  }

  /**
   * Kiểm tra competition có đang diễn ra không
   */
  isOngoing(): boolean {
    if (!this.hasTimeLimit()) return true // Không giới hạn thời gian = luôn đang diễn ra
    const now = new Date()
    return now >= this.startDate! && now <= this.endDate!
  }

  /**
   * Kiểm tra competition đã kết thúc chưa
   */
  isEnded(): boolean {
    if (!this.hasTimeLimit()) return false // Không giới hạn thời gian = chưa kết thúc
    return new Date() > this.endDate!
  }

  /**
   * Kiểm tra competition chưa bắt đầu
   */
  isUpcoming(): boolean {
    if (!this.hasTimeLimit()) return false // Không giới hạn thời gian = không phải sắp tới
    return new Date() < this.startDate!
  }

  /**
   * Lấy trạng thái hiện tại
   */
  getStatus(): 'upcoming' | 'ongoing' | 'ended' {
    if (this.isUpcoming()) return 'upcoming'
    if (this.isOngoing()) return 'ongoing'
    return 'ended'
  }

  /**
   * Lấy trạng thái hiển thị
   */
  getStatusDisplay(): string {
    const status = this.getStatus()
    const statusMap = {
      upcoming: '🔜 Sắp diễn ra',
      ongoing: '▶️ Đang diễn ra',
      ended: '✅ Đã kết thúc',
    }
    return statusMap[status]
  }

  /**
   * Kiểm tra competition có được xuất bản không
   */
  isPublished(): boolean {
    return this.visibility === Visibility.PUBLISHED
  }

  /**
   * Kiểm tra competition có phải draft không
   */
  isDraft(): boolean {
    return this.visibility === Visibility.DRAFT
  }

  /**
   * Kiểm tra competition có phải private không
   */
  isPrivate(): boolean {
    return this.visibility === Visibility.PRIVATE
  }

  /**
   * Kiểm tra user có thể tham gia không
   */
  canParticipate(): boolean {
    return this.isPublished() && this.isOngoing()
  }

  /**
   * Kiểm tra user có thể xem kết quả chi tiết không
   */
  canViewResultDetail(): boolean {
    return this.showResultDetail
  }

  /**
   * Kiểm tra user có thể xem bảng xếp hạng không
   */
  canViewLeaderboard(): boolean {
    return this.allowLeaderboard
  }

  /**
   * Kiểm tra user có thể xem điểm không
   */
  canViewScore(): boolean {
    return this.allowViewScore
  }

  /**
   * Kiểm tra user có thể xem đáp án không
   */
  canViewAnswer(): boolean {
    return this.allowViewAnswer && this.isEnded()
  }

  /**
   * Kiểm tra có bật chống gian lận không
   */
  hasAntiCheating(): boolean {
    return this.enableAntiCheating
  }

  /**
   * Tính thời gian còn lại đến khi bắt đầu (milliseconds)
   */
  getTimeUntilStart(): number {
    if (!this.hasTimeLimit() || !this.startDate) return 0
    return this.startDate.getTime() - new Date().getTime()
  }

  /**
   * Tính thời gian còn lại đến khi kết thúc (milliseconds)
   */
  getTimeUntilEnd(): number {
    if (!this.hasTimeLimit() || !this.endDate) return 0
    return this.endDate.getTime() - new Date().getTime()
  }

  /**
   * Lấy thời gian còn lại hiển thị
   */
  getTimeRemainingDisplay(): string {
    if (!this.hasTimeLimit()) return 'Không giới hạn thời gian'
    if (this.isEnded()) return 'Đã kết thúc'
    if (this.isUpcoming()) {
      const ms = this.getTimeUntilStart()
      return this.formatTimeRemaining(ms)
    }
    if (this.isOngoing()) {
      const ms = this.getTimeUntilEnd()
      return this.formatTimeRemaining(ms)
    }
    return ''
  }

  /**
   * Format thời gian còn lại
   */
  private formatTimeRemaining(ms: number): string {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days} ngày ${hours} giờ`
    if (hours > 0) return `${hours} giờ ${minutes} phút`
    return `${minutes} phút`
  }

  /**
   * Kiểm tra competition có được tạo bởi admin cụ thể không
   */
  isCreatedBy(adminId: number): boolean {
    return this.createdBy === adminId
  }

  /**
   * Lấy thông tin đầy đủ
   */
  getFullTitle(): string {
    if (this.hasSubtitle()) {
      return `${this.title} - ${this.subtitle}`
    }
    return this.title
  }

  /**
   * Serialize để gửi qua API
   */
  toJSON() {
    return {
      competitionId: this.competitionId,
      title: this.title,
      subtitle: this.subtitle,
      startDate: this.startDate,
      endDate: this.endDate,
      policies: this.policies,
      createdBy: this.createdBy,
      visibility: this.visibility,
      durationMinutes: this.durationMinutes,
      maxAttempts: this.maxAttempts,
      showResultDetail: this.showResultDetail,
      allowLeaderboard: this.allowLeaderboard,
      allowViewScore: this.allowViewScore,
      allowViewAnswer: this.allowViewAnswer,
      enableAntiCheating: this.enableAntiCheating,
      allowViewSolutionYoutubeUrl: this.allowViewSolutionYoutubeUrl,
      allowViewExamContent: this.allowViewExamContent,
      examId: this.examId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Computed fields
      hasTimeLimit: this.hasTimeLimit(),
      hasExam: this.hasExam(),
      hasSubtitle: this.hasSubtitle(),
      hasPolicies: this.hasPolicies(),
      hasDuration: this.hasDuration(),
      hasMaxAttempts: this.hasMaxAttempts(),
      hasLearningItems: this.hasLearningItems(),
      durationDisplay: this.getDurationDisplay(),
      maxAttemptsDisplay: this.getMaxAttemptsDisplay(),
      visibilityDisplay: this.getVisibilityDisplay(),
      status: this.getStatus(),
      statusDisplay: this.getStatusDisplay(),
      isPublished: this.isPublished(),
      isDraft: this.isDraft(),
      isPrivate: this.isPrivate(),
      isOngoing: this.isOngoing(),
      isEnded: this.isEnded(),
      isUpcoming: this.isUpcoming(),
      canParticipate: this.canParticipate(),
      canViewResultDetail: this.canViewResultDetail(),
      canViewLeaderboard: this.canViewLeaderboard(),
      canViewScore: this.canViewScore(),
      canViewAnswer: this.canViewAnswer(),
      hasAntiCheating: this.hasAntiCheating(),
      timeRemainingDisplay: this.getTimeRemainingDisplay(),
      fullTitle: this.getFullTitle(),
      // Relations
      exam: this.exam ? this.exam.toJSON() : undefined,
      admin: this.admin
        ? {
            adminId: this.admin.adminId,
            userId: this.admin.userId,
            fullName: this.admin.getFullName ? this.admin.getFullName() : undefined,
          }
        : undefined,
    }
  }

  /**
   * Tạo entity từ Prisma model data
   */
  static fromPrisma(data: any): Competition {
    return new Competition({
      competitionId: data.competitionId,
      title: data.title,
      subtitle: data.subtitle,
      startDate: data.startDate,
      endDate: data.endDate,
      policies: data.policies,
      createdBy: data.createdBy,
      visibility: data.visibility,
      durationMinutes: data.durationMinutes,
      maxAttempts: data.maxAttempts,
      showResultDetail: data.showResultDetail,
      allowLeaderboard: data.allowLeaderboard,
      allowViewScore: data.allowViewScore,
      allowViewAnswer: data.allowViewAnswer,
      enableAntiCheating: data.enableAntiCheating,
      allowViewSolutionYoutubeUrl: data.allowViewSolutionYoutubeUrl ?? false,
      allowViewExamContent: data.allowViewExamContent ?? false,
      examId: data.examId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      exam: data.exam ? Exam.fromPrisma(data.exam) : undefined,
      admin: data.admin,
      learningItems: data.learningItems,
    })
  }

  /**
   * Tạo competition cơ bản
   */
  static createBasic(
    competitionId: number,
    title: string,
    createdBy: number,
    startDate?: Date | null,
    endDate?: Date | null,
  ): Competition {
    const now = new Date()
    return new Competition({
      competitionId,
      title,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      createdBy,
      visibility: Visibility.DRAFT,
      showResultDetail: false,
      allowLeaderboard: false,
      allowViewScore: true,
      allowViewAnswer: false,
      enableAntiCheating: false,
      allowViewSolutionYoutubeUrl: false,
      allowViewExamContent: false,
      createdAt: now,
      updatedAt: now,
    })
  }
}
