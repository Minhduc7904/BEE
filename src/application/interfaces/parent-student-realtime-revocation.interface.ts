/**
 * Thu hồi quyền realtime của phụ huynh đối với một học sinh sau khi gỡ liên kết ParentStudent.
 * Mọi socket của tài khoản phụ huynh phải rời các room theo dõi thanh toán thuộc học sinh đó ngay lập tức.
 */
export abstract class ParentStudentRealtimeRevocationService {
  abstract revokeStudentAccess(parentUserId: number, studentId: number): Promise<void>
}
