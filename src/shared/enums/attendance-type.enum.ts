export enum AttendanceType {
  REGULAR = 'REGULAR',
  MAKEUP = 'MAKEUP',
}

export const AttendanceTypeLabels: Record<AttendanceType, string> = {
  [AttendanceType.REGULAR]: 'Chính khóa',
  [AttendanceType.MAKEUP]: 'Học bù',
}
