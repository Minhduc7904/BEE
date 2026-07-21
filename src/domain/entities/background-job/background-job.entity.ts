import { BackgroundJobCode } from '../../../shared/enums'

export class BackgroundJob {
  backgroundJobId: number
  code: BackgroundJobCode
  displayName: string
  cronExpression: string
  timezone: string
  isEnabled: boolean
  maxRuntimeSeconds: number
  createdAt: Date
  updatedAt: Date

  constructor(data: {
    backgroundJobId: number
    code: BackgroundJobCode
    displayName: string
    cronExpression: string
    timezone: string
    isEnabled: boolean
    maxRuntimeSeconds: number
    createdAt: Date
    updatedAt: Date
  }) {
    this.backgroundJobId = data.backgroundJobId
    this.code = data.code
    this.displayName = data.displayName
    this.cronExpression = data.cronExpression
    this.timezone = data.timezone
    this.isEnabled = data.isEnabled
    this.maxRuntimeSeconds = data.maxRuntimeSeconds
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  canRun(): boolean {
    return this.isEnabled
  }
}
