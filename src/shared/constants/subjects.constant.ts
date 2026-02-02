// src/shared/constants/subjects.constant.ts

export const SUBJECTS = [
  {
    id: 1,
    name: 'Toán học',
    code: 'MATH',
  },
  {
    id: 2,
    name: 'Vật lý',
    code: 'PHYSICS',
  },
  {
    id: 3,
    name: 'Hóa học',
    code: 'CHEMISTRY',
  },
  {
    id: 4,
    name: 'Sinh học',
    code: 'BIOLOGY',
  },
  {
    id: 5,
    name: 'Ngữ văn',
    code: 'LITERATURE',
  },
  {
    id: 6,
    name: 'Tiếng Anh',
    code: 'ENGLISH',
  },
  {
    id: 7,
    name: 'Lịch sử',
    code: 'HISTORY',
  },
  {
    id: 8,
    name: 'Địa lý',
    code: 'GEOGRAPHY',
  },
]

/**
 * Subject codes để sử dụng trong code
 */
export const SUBJECT_CODES = {
  MATH: 'MATH',
  PHYSICS: 'PHYSICS',
  CHEMISTRY: 'CHEMISTRY',
  BIOLOGY: 'BIOLOGY',
  LITERATURE: 'LITERATURE',
  ENGLISH: 'ENGLISH',
  HISTORY: 'HISTORY',
  GEOGRAPHY: 'GEOGRAPHY',
} as const

/**
 * Subject IDs từ database
 */
export const SUBJECT_IDS = {
  MATH: 1,
  PHYSICS: 2,
  CHEMISTRY: 3,
  BIOLOGY: 4,
  LITERATURE: 5,
  ENGLISH: 6,
  HISTORY: 7,
  GEOGRAPHY: 8,
} as const

export type SubjectCode = (typeof SUBJECT_CODES)[keyof typeof SUBJECT_CODES]
export type SubjectId = (typeof SUBJECT_IDS)[keyof typeof SUBJECT_IDS]
