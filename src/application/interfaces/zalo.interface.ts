/** Application port and Nest injection token for ZaloService. */
export abstract class ZaloService {}

export interface ZaloService {
  isRegisterParentIntent(...args: any[]): any
  isUnregisterIntent(...args: any[]): any
  isLatestAttendanceIntent(...args: any[]): any
  isTuitionSummaryIntent(...args: any[]): any
  isViewScheduleIntent(...args: any[]): any
  formatParentClassScheduleSummary(...args: any[]): any
  formatTuitionSummary(...args: any[]): any
  formatLatestAttendanceSummary(...args: any[]): any
  sendMessage(...args: any[]): any
  sendRegistrationPrompt(...args: any[]): any
  sendUnregisteredParentMenu(...args: any[]): any
  sendMainMenu(...args: any[]): any
  sendParentMenu(...args: any[]): any
}

