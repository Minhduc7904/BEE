/** Application port and Nest injection token for SocketRoomService. */
export abstract class SocketRoomService {}

export interface SocketRoomService {
  getUserRoom(...args: any[]): any
  getLessonRoom(...args: any[]): any
  getCourseRoom(...args: any[]): any
  getClassSessionRoom(...args: any[]): any
  getAdminRoom(...args: any[]): any
  getStudentRoom(...args: any[]): any
  getRoleRoom(...args: any[]): any
  joinUserRoom(...args: any[]): any
  leaveUserRoom(...args: any[]): any
  joinRoleRoom(...args: any[]): any
  parseRoomId(...args: any[]): any
}

