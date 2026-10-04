import { IsRequiredIntArrayIncludingEmpty } from 'src/shared/decorators/validate'

/**
 * DTO thay toàn bộ danh sách lớp học bù của một lớp nguồn
 * @description Gửi mảng rỗng để xóa toàn bộ cấu hình học bù của lớp nguồn
 */
export class ReplaceCourseClassMakeupOptionsDto {
  /**
   * Danh sách ID lớp đích; không được trùng và không được chứa chính lớp nguồn
   * @example [152, 153, 154]
   */
  @IsRequiredIntArrayIncludingEmpty('Danh sách lớp học bù')
  makeupClassIds: number[]
}
