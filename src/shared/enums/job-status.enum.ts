// src/shared/enums/job-status.enum.ts
/**
 * Job Status Enum
 * Đồng bộ với Prisma schema enum JobStatus
 */
export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  RETRYING = 'RETRYING',
}

/**
 * Job Status Labels
 */
export const JobStatusLabels: Record<JobStatus, string> = {
  [JobStatus.PENDING]: 'Đang chờ xử lý',
  [JobStatus.PROCESSING]: 'Đang xử lý',
  [JobStatus.COMPLETED]: 'Hoàn thành',
  [JobStatus.FAILED]: 'Thất bại',
  [JobStatus.CANCELLED]: 'Đã hủy',
  [JobStatus.RETRYING]: 'Đang thử lại',
}

/**
 * Job Status Colors (for UI)
 */
export const JobStatusColors: Record<JobStatus, string> = {
  [JobStatus.PENDING]: 'gray',
  [JobStatus.PROCESSING]: 'blue',
  [JobStatus.COMPLETED]: 'green',
  [JobStatus.FAILED]: 'red',
  [JobStatus.CANCELLED]: 'orange',
  [JobStatus.RETRYING]: 'yellow',
}

/**
 * Kiểm tra job đã hoàn thành (thành công hoặc thất bại)
 */
export function isJobFinished(status: JobStatus): boolean {
  return [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED].includes(status)
}

/**
 * Kiểm tra job đang trong quá trình xử lý
 */
export function isJobInProgress(status: JobStatus): boolean {
  return [JobStatus.PENDING, JobStatus.PROCESSING, JobStatus.RETRYING].includes(status)
}
