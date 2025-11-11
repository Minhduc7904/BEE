import { StorageProvider } from '../../../shared/enums'

export class FileResponseDto {

        adminId?: number

        url: string

        anotherUrl?: string

        mimeType?: string

        storageProvider: StorageProvider

        createdAt: Date

        updatedAt: Date
}