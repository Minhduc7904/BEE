export enum TuitionCollectionMode {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL_FALLBACK = 'MANUAL_FALLBACK',
}

export const TuitionCollectionModeLabels: Record<TuitionCollectionMode, string> = {
  [TuitionCollectionMode.AUTOMATIC]: 'Tự động',
  [TuitionCollectionMode.MANUAL_FALLBACK]: 'Chờ đối soát thủ công',
}
