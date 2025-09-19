// src/shared/enums/difficulty.enum.ts

/**
 * Question Difficulty Enum
 * Đồng bộ với Prisma schema enum Difficulty
 */
export enum Difficulty {
  TH = 'TH', // Thông hiểu
  NB = 'NB', // Nhận biết
  VD = 'VD', // Vận dụng
  VDC = 'VDC', // Vận dụng cao
}

/**
 * Difficulty Labels
 */
export const DifficultyLabels: Record<Difficulty, string> = {
  [Difficulty.TH]: 'Thông hiểu',
  [Difficulty.NB]: 'Nhận biết',
  [Difficulty.VD]: 'Vận dụng',
  [Difficulty.VDC]: 'Vận dụng cao',
}

/**
 * Difficulty Levels (từ dễ đến khó)
 */
export const DifficultyLevels: Record<Difficulty, number> = {
  [Difficulty.NB]: 1,
  [Difficulty.TH]: 2,
  [Difficulty.VD]: 3,
  [Difficulty.VDC]: 4,
}

/**
 * Difficulty Colors for UI
 */
export const DifficultyColors: Record<Difficulty, string> = {
  [Difficulty.NB]: 'blue',
  [Difficulty.TH]: 'green',
  [Difficulty.VD]: 'orange',
  [Difficulty.VDC]: 'red',
}
