/** Đồng bộ với Prisma enum BackgroundJobRunStatus. */
export enum BackgroundJobRunStatus {
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export const BackgroundJobRunStatusLabels: Record<BackgroundJobRunStatus, string> = {
  [BackgroundJobRunStatus.RUNNING]: 'Đang chạy',
  [BackgroundJobRunStatus.SUCCEEDED]: 'Thành công',
  [BackgroundJobRunStatus.FAILED]: 'Thất bại',
  [BackgroundJobRunStatus.SKIPPED]: 'Đã bỏ qua',
}

export function isBackgroundJobRunFinished(status: BackgroundJobRunStatus): boolean {
  return status !== BackgroundJobRunStatus.RUNNING
}
