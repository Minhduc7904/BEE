import { BackgroundJobRun } from '../entities/background-job'
import type {
  BackgroundJobRunListOptions,
  CreateBackgroundJobRunData,
  UpdateBackgroundJobRunData,
} from '../interface/background-job'

export interface IBackgroundJobRunRepository {
  create(data: CreateBackgroundJobRunData): Promise<BackgroundJobRun>
  findById(backgroundJobRunId: number): Promise<BackgroundJobRun | null>
  findAll(options: BackgroundJobRunListOptions): Promise<{ data: BackgroundJobRun[]; total: number }>
  findByBackgroundJobAndScheduledAt(backgroundJobId: number, scheduledAt: Date): Promise<BackgroundJobRun | null>
  findLatestByBackgroundJobId(backgroundJobId: number): Promise<BackgroundJobRun | null>
  update(backgroundJobRunId: number, data: UpdateBackgroundJobRunData): Promise<BackgroundJobRun>
}
