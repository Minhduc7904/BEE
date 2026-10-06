import { IsRequiredIntArrayIncludingEmpty } from 'src/shared/decorators/validate'

/**
 * DTO đặt các lớp cùng nhóm học bù với một lớp
 * @description Nhóm gồm lớp nguồn và các lớp trong danh sách; gửi mảng rỗng để bỏ mọi lớp bạn
 * (nhóm bị giải tán, mọi lớp của nhóm cũ chưa thuộc nhóm nào). Thay đổi áp dụng cho cả nhóm.
 */
export class ReplaceCourseClassMakeupGroupDto {
  /**
   * ID các lớp học bù cùng nhóm với lớp nguồn; không được trùng và không được chứa chính lớp nguồn
   * @example [152, 153, 154]
   */
  @IsRequiredIntArrayIncludingEmpty('Danh sách lớp học bù')
  makeupClassIds: number[]
}
