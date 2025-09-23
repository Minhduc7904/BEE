// src/shared/enums/gender.enum.ts

/**
 * User Gender Enum
 * Đồng bộ với Prisma schema enum Gender
 */
export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
}

/**
 * Gender Labels (dùng hiển thị UI)
 */
export const GenderLabels: Record<Gender, string> = {
    [Gender.MALE]: 'Nam',
    [Gender.FEMALE]: 'Nữ',
    [Gender.OTHER]: 'Khác',
}

/**
 * Gender Short Labels (viết tắt)
 */
export const GenderShortLabels: Record<Gender, string> = {
    [Gender.MALE]: 'M',
    [Gender.FEMALE]: 'F',
    [Gender.OTHER]: 'O',
}

/**
 * Gender Colors cho UI
 */
export const GenderColors: Record<Gender, string> = {
    [Gender.MALE]: 'blue',
    [Gender.FEMALE]: 'pink',
    [Gender.OTHER]: 'gray',
}
