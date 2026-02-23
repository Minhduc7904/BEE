/**
 * TypeOfExam Enum
 * Loại đề thi/kiểm tra
 */
export enum TypeOfExam {
  /**
   * Cuối kỳ 1
   */
  CK1 = 'CK1',

  /**
   * Cuối kỳ 2
   */
  CK2 = 'CK2',

  /**
   * Giữa kỳ 1
   */
  GK1 = 'GK1',

  /**
   * Giữa kỳ 2
   */
  GK2 = 'GK2',

  /**
   * Tuyển sinh A / Thi Đại học khối A
   */
  TSA = 'TSA',

  /**
   * THPT Quốc Gia
   */
  THPT = 'THPT',

  /**
   * Ôn tập THPT Quốc Gia
   */
  OTTHPT = 'OTTHPT',

  /**
   * Ôn tập
   */
  OT = 'OT',

  /**
   * Học sinh A / High School A
   */
  HSA = 'HSA',

  /**
   * Ôn tập học sinh
   */
  OTHS = 'OTHS',
}

/**
 * Type of Exam Labels - Nhãn hiển thị cho từng loại đề thi
 */
export const TYPE_OF_EXAM_LABELS: Record<TypeOfExam, string> = {
  [TypeOfExam.CK1]: 'Cuối kỳ 1',
  [TypeOfExam.CK2]: 'Cuối kỳ 2',
  [TypeOfExam.GK1]: 'Giữa kỳ 1',
  [TypeOfExam.GK2]: 'Giữa kỳ 2',
  [TypeOfExam.TSA]: 'Tuyển sinh Đại học',
  [TypeOfExam.THPT]: 'THPT Quốc Gia',
  [TypeOfExam.OTTHPT]: 'Ôn tập THPT',
  [TypeOfExam.OT]: 'Ôn tập',
  [TypeOfExam.HSA]: 'Học sinh giỏi',
  [TypeOfExam.OTHS]: 'Ôn tập chung',
};

/**
 * Type of Exam Descriptions - Mô tả chi tiết
 */
export const TYPE_OF_EXAM_DESCRIPTIONS: Record<TypeOfExam, string> = {
  [TypeOfExam.CK1]: 'Đề thi cuối học kỳ 1',
  [TypeOfExam.CK2]: 'Đề thi cuối học kỳ 2',
  [TypeOfExam.GK1]: 'Đề thi giữa học kỳ 1',
  [TypeOfExam.GK2]: 'Đề thi giữa học kỳ 2',
  [TypeOfExam.TSA]: 'Đề thi tuyển sinh Đại học khối A',
  [TypeOfExam.THPT]: 'Đề thi THPT Quốc Gia',
  [TypeOfExam.OTTHPT]: 'Đề ôn tập THPT Quốc Gia',
  [TypeOfExam.OT]: 'Đề ôn tập chung',
  [TypeOfExam.HSA]: 'Đề thi học sinh giỏi',
  [TypeOfExam.OTHS]: 'Đề ôn tập học sinh',
};
