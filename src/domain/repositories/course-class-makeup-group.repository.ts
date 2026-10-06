import type {
  CourseClassMakeupCandidate,
  MakeupGroup,
  SaveMakeupGroupParams,
} from '../interface/course-class/course-class-makeup-group.interface'

/**
 * Nhóm lớp học bù cho nhau. Một lớp thuộc tối đa một nhóm; nhóm có hiệu lực khi có ít nhất 2 lớp.
 */
export interface ICourseClassMakeupGroupRepository {
  /**
   * Mọi lớp thuộc khóa học, sắp xếp theo className rồi classId.
   */
  findClassesByCourse(courseId: number): Promise<CourseClassMakeupCandidate[]>

  /**
   * Mọi nhóm có ít nhất một lớp thuộc khóa học, kèm danh sách lớp thành viên (kể cả nhóm chỉ còn 1 lớp do lớp bị xóa).
   */
  findGroupsByCourse(courseId: number): Promise<MakeupGroup[]>

  /**
   * Thêm/bớt lớp trong nhóm; tạo nhóm mới khi `groupId` là `null`. Trả về ID nhóm sau khi lưu.
   * Chỉ chạm các dòng cần đổi nên các lần lưu đồng thời không gây deadlock. Lớp vừa bị chuyển khỏi nhóm
   * mồ côi (còn dưới 2 lớp) sẽ được dọn, nhóm rỗng bị xóa.
   * Hai lần lưu xung đột cùng một lớp ném `ConflictException`.
   */
  saveGroup(params: SaveMakeupGroupParams): Promise<number>

  /**
   * Giải tán nhóm: xóa nhóm và toàn bộ thành viên.
   */
  dissolveGroup(groupId: number): Promise<void>
}
