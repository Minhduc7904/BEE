// src/application/use-cases/notification/create-and-notify-many.use-case.ts
import { Injectable } from '@nestjs/common'
import type { CreateNotificationData } from '../../../domain/interface/notification/notification.interface'
import type { BusinessNotificationSource } from './business-notification-queue.service'
import { BusinessNotificationQueueService } from './business-notification-queue.service'

/**
 * CreateAndNotifyManyUseCase
 *
 * Compatibility adapter: a bulk call creates one dispatch job with per-recipient payloads.
 */
@Injectable()
export class CreateAndNotifyManyUseCase {
    constructor(private readonly queue: BusinessNotificationQueueService) {}

    execute(dataList: CreateNotificationData[], source?: Partial<BusinessNotificationSource>) {
        return this.queue.enqueueInApp(dataList, source)
    }
}
