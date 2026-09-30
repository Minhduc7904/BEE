// src/application/use-cases/notification/create-and-notify-one.use-case.ts
import { Injectable } from '@nestjs/common'
import type { CreateNotificationData } from '../../../domain/interface/notification/notification.interface'
import type { BusinessNotificationSource } from './business-notification-queue.service'
import { BusinessNotificationQueueService } from './business-notification-queue.service'

/**
 * CreateAndNotifyOneUseCase
 *
 * Compatibility adapter: every legacy in-app notification now enters the dispatch queue.
 */
@Injectable()
export class CreateAndNotifyOneUseCase {
    constructor(private readonly queue: BusinessNotificationQueueService) {}

    execute(data: CreateNotificationData, source?: Partial<BusinessNotificationSource>) {
        return this.queue.enqueueInApp([data], source)
    }
}
