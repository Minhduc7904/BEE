// src/domain/entities/job/job.entity.ts

import { JobStatus, JobType } from '../../../shared/enums'
import { User } from '../user/user.entity'

/**
 * Job Entity
 * Domain entity đại diện cho 1 công việc trong hàng đợi xử lý
 */
export class Job {
  // Required properties
  jobId: number
  type: JobType
  status: JobStatus
  priority: number
  retryCount: number
  maxRetries: number
  createdAt: Date
  updatedAt: Date

  // Optional properties
  payload?: Record<string, any> | null
  result?: Record<string, any> | null
  errorMessage?: string | null
  errorStack?: string | null
  scheduledAt?: Date | null
  startedAt?: Date | null
  completedAt?: Date | null
  createdBy?: number | null
  metadata?: Record<string, any> | null

  // Relations (optional - sẽ được populate khi cần)
  creator?: User | null

  constructor(data: {
    jobId: number
    type: JobType
    status: JobStatus
    priority: number
    retryCount: number
    maxRetries: number
    createdAt: Date
    updatedAt: Date
    payload?: Record<string, any> | null
    result?: Record<string, any> | null
    errorMessage?: string | null
    errorStack?: string | null
    scheduledAt?: Date | null
    startedAt?: Date | null
    completedAt?: Date | null
    createdBy?: number | null
    metadata?: Record<string, any> | null
    creator?: User | null
  }) {
    this.jobId = data.jobId
    this.type = data.type
    this.status = data.status
    this.priority = data.priority
    this.retryCount = data.retryCount
    this.maxRetries = data.maxRetries
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.payload = data.payload
    this.result = data.result
    this.errorMessage = data.errorMessage
    this.errorStack = data.errorStack
    this.scheduledAt = data.scheduledAt
    this.startedAt = data.startedAt
    this.completedAt = data.completedAt
    this.createdBy = data.createdBy
    this.metadata = data.metadata
    this.creator = data.creator
  }

  /* ===================== BUSINESS METHODS ===================== */

  /**
   * Kiểm tra job đã hoàn thành chưa
   */
  isCompleted(): boolean {
    return this.status === JobStatus.COMPLETED
  }

  /**
   * Kiểm tra job có lỗi không
   */
  isFailed(): boolean {
    return this.status === JobStatus.FAILED
  }

  /**
   * Kiểm tra job đang xử lý
   */
  isProcessing(): boolean {
    return this.status === JobStatus.PROCESSING
  }

  /**
   * Kiểm tra job đang chờ
   */
  isPending(): boolean {
    return this.status === JobStatus.PENDING
  }

  /**
   * Kiểm tra job đã bị hủy
   */
  isCancelled(): boolean {
    return this.status === JobStatus.CANCELLED
  }

  /**
   * Kiểm tra job đang retry
   */
  isRetrying(): boolean {
    return this.status === JobStatus.RETRYING
  }

  /**
   * Kiểm tra job đã kết thúc (completed/failed/cancelled)
   */
  isFinished(): boolean {
    return [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED].includes(this.status)
  }

  /**
   * Kiểm tra job có thể retry không
   */
  canRetry(): boolean {
    return this.retryCount < this.maxRetries && this.isFailed()
  }

  /**
   * Kiểm tra job có priority cao không
   */
  isHighPriority(): boolean {
    return this.priority >= 10
  }

  /**
   * Kiểm tra job đã quá hạn chưa (nếu có scheduledAt)
   */
  isOverdue(): boolean {
    if (!this.scheduledAt) return false
    return this.scheduledAt < new Date() && !this.isFinished()
  }

  /**
   * Lấy thời gian xử lý (ms)
   */
  getProcessingDuration(): number | null {
    if (!this.startedAt) return null
    const endTime = this.completedAt || new Date()
    return endTime.getTime() - this.startedAt.getTime()
  }

  /**
   * Lấy thời gian chờ (ms)
   */
  getWaitingDuration(): number | null {
    if (!this.startedAt) {
      return new Date().getTime() - this.createdAt.getTime()
    }
    return this.startedAt.getTime() - this.createdAt.getTime()
  }

  /**
   * Lấy tổng thời gian từ khi tạo đến hoàn thành (ms)
   */
  getTotalDuration(): number | null {
    if (!this.isFinished()) return null
    return this.completedAt!.getTime() - this.createdAt.getTime()
  }

  /**
   * Đánh dấu job bắt đầu xử lý
   */
  markAsProcessing(): void {
    this.status = JobStatus.PROCESSING
    this.startedAt = new Date()
  }

  /**
   * Đánh dấu job hoàn thành
   */
  markAsCompleted(result?: Record<string, any>): void {
    this.status = JobStatus.COMPLETED
    this.completedAt = new Date()
    if (result) {
      this.result = result
    }
  }

  /**
   * Đánh dấu job thất bại
   */
  markAsFailed(error: Error | string): void {
    this.status = JobStatus.FAILED
    this.completedAt = new Date()
    
    if (error instanceof Error) {
      this.errorMessage = error.message
      this.errorStack = error.stack || null
    } else {
      this.errorMessage = error
    }
  }

  /**
   * Đánh dấu job retry
   */
  markAsRetrying(): void {
    this.status = JobStatus.RETRYING
    this.retryCount++
  }

  /**
   * Đánh dấu job bị hủy
   */
  markAsCancelled(): void {
    this.status = JobStatus.CANCELLED
    this.completedAt = new Date()
  }

  /**
   * Reset job để retry
   */
  resetForRetry(): void {
    this.status = JobStatus.PENDING
    this.startedAt = null
    this.completedAt = null
    this.errorMessage = null
    this.errorStack = null
    this.retryCount++
  }

  /**
   * Update metadata
   */
  updateMetadata(metadata: Record<string, any>): void {
    this.metadata = { ...this.metadata, ...metadata }
  }

  /**
   * Lấy progress từ metadata (nếu có)
   */
  getProgress(): number | null {
    if (!this.metadata) return null
    return (this.metadata as any).progress || null
  }

  /**
   * Set progress vào metadata
   */
  setProgress(progress: number): void {
    this.updateMetadata({ progress })
  }
}
