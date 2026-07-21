import { BackgroundJobCode } from '../../shared/enums'
import { BackgroundJob } from '../entities/background-job'
import type {
  BackgroundJobListOptions,
  CreateBackgroundJobData,
  UpdateBackgroundJobData,
} from '../interface/background-job'

export interface IBackgroundJobRepository {
  create(data: CreateBackgroundJobData): Promise<BackgroundJob>
  upsert(data: CreateBackgroundJobData): Promise<BackgroundJob>
  findById(backgroundJobId: number): Promise<BackgroundJob | null>
  findByCode(code: BackgroundJobCode): Promise<BackgroundJob | null>
  findAll(options: BackgroundJobListOptions): Promise<{ data: BackgroundJob[]; total: number }>
  findAllEnabled(): Promise<BackgroundJob[]>
  update(backgroundJobId: number, data: UpdateBackgroundJobData): Promise<BackgroundJob>
}
