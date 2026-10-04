import type {
  CourseClassMakeupCandidate,
  CourseClassMakeupEdge,
  LockedMakeupSourceClass,
} from '../interface/course-class/course-class-makeup-option.interface'

export interface ICourseClassMakeupOptionRepository {
  /**
   * Locking read (khóa chia sẻ) đầu transaction trên row lớp nguồn, trả `classId`/`courseId` mới nhất hoặc `null` nếu không có lớp.
   * Phải là truy vấn đầu tiên của transaction: locking read không tạo snapshot REPEATABLE-READ, nhờ đó
   * các lần đọc thường phía sau (nguồn, đích, lớp trong course, graph) thấy dữ liệu đã commit sau khi có khóa.
   */
  lockSourceClassForGraphUpdate(classId: number): Promise<LockedMakeupSourceClass | null>

  /**
   * Khóa row course để mọi lần thay đổi graph học bù trong cùng course được tuần tự hóa.
   * Phải gọi sau `lockSourceClassForGraphUpdate` và trước mọi lần đọc dữ liệu graph.
   */
  lockCourseForGraphUpdate(courseId: number): Promise<void>

  /**
   * Mọi lớp thuộc course, sắp xếp theo className rồi classId.
   */
  findClassesByCourse(courseId: number): Promise<CourseClassMakeupCandidate[]>

  /**
   * Toàn bộ cạnh học bù có lớp nguồn thuộc course.
   */
  findEdgesByCourse(courseId: number): Promise<CourseClassMakeupEdge[]>

  /**
   * Thay toàn bộ cạnh đi ra từ lớp nguồn bằng danh sách lớp đích mới.
   */
  replaceForSource(sourceClassId: number, makeupClassIds: number[]): Promise<void>
}
