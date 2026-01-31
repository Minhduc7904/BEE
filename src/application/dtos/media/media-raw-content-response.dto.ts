export class MediaRawContentResponseDto {
  mediaId: number
  rawContent: string
  processedContent: string
  childMediaCount: number
  metadata?: {
    replacedImagesCount: number
    childMediaIds: number[]
  }
}
