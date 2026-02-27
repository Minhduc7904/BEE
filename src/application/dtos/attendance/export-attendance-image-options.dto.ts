// src/application/dtos/attendance/export-attendance-image-options.dto.ts
import { IsOptionalEnumValue, IsOptionalBoolean, IsOptionalInt } from 'src/shared/decorators/validate'

enum DisplayMode {
  DOWNLOAD = 'download',
  VIEW = 'view',
}

enum ImageFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  WEBP = 'webp',
}

/**
 * DTO for exporting attendance as image with customization options
 * 
 * @description Used to configure image export settings for attendance records
 */
export class ExportAttendanceImageOptionsDto {
  /**
   * Display mode
   * @optional
   * @default DisplayMode.DOWNLOAD
   * @example DisplayMode.DOWNLOAD
   */
  @IsOptionalEnumValue(DisplayMode, 'Chế độ hiển thị')
  mode?: DisplayMode = DisplayMode.DOWNLOAD

  /**
   * Image format
   * @optional
   * @default ImageFormat.PNG
   * @example ImageFormat.PNG
   */
  @IsOptionalEnumValue(ImageFormat, 'Định dạng ảnh')
  format?: ImageFormat = ImageFormat.PNG

  /**
   * Image quality 0-100 (for jpeg/webp)
   * @optional
   * @default 90
   * @example 90
   */
  @IsOptionalInt('Chất lượng ảnh', 0, 100)
  quality?: number = 90

  /**
   * Viewport width in pixels
   * @optional
   * @default 1200
   * @example 1200
   */
  @IsOptionalInt('Chiều rộng ảnh', 100, 5000)
  width?: number = 1200

  /**
   * Include student photo
   * @optional
   * @default true
   * @example true
   */
  @IsOptionalBoolean('Bao gồm ảnh học sinh')
  includePhoto?: boolean = true

  /**
   * Include parent phone
   * @optional
   * @default true
   * @example true
   */
  @IsOptionalBoolean('Bao gồm số điện thoại phụ huynh')
  includeParentPhone?: boolean = true

  /**
   * Include student phone
   * @optional
   * @default false
   * @example false
   */
  @IsOptionalBoolean('Bao gồm số điện thoại học sinh')
  includeStudentPhone?: boolean = false

  /** Include email (default: true) */
  @IsOptionalBoolean('Bao gồm email')
  includeEmail?: boolean = true

  /** Include notes (default: true) */
  @IsOptionalBoolean('Bao gồm ghi chú')
  includeNotes?: boolean = true

  /** Include QR code (default: false) */
  @IsOptionalBoolean('Bao gồm mã QR')
  includeQRCode?: boolean = false

  /** Include teacher name (default: true) */
  @IsOptionalBoolean('Bao gồm tên giáo viên')
  includeTeacherName?: boolean = true

  /** Include marker name (default: true) */
  @IsOptionalBoolean('Bao gồm tên người đánh dấu')
  includeMarkerName?: boolean = true

  /** Include session start time (default: true) */
  @IsOptionalBoolean('Bao gồm thời gian bắt đầu phiên')
  includeStartTime?: boolean = true

  /** Include session end time (default: true) */
  @IsOptionalBoolean('Bao gồm thời gian kết thúc phiên')
  includeEndTime?: boolean = true

  /** Include student ID (default: true) */
  @IsOptionalBoolean('Bao gồm mã học sinh')
  includeStudentId?: boolean = true

  /** Include class name (default: true) */
  @IsOptionalBoolean('Bao gồm tên lớp học')
  includeClassName?: boolean = true

  /** Include course name (default: true) */
  @IsOptionalBoolean('Bao gồm tên khóa học')
  includeCourseName?: boolean = true

  /** Include marked at time (default: true) */
  @IsOptionalBoolean('Bao gồm thời gian điểm danh')
  includeMarkedAt?: boolean = true

  /** Include grade and school (default: true) */
  @IsOptionalBoolean('Bao gồm khối và trường học')
  includeGradeSchool?: boolean = true

  /** Include tuition section (default: true) */
  @IsOptionalBoolean('Bao gồm phần học phí')
  includeTuition?: boolean = true

  /**
   * Tháng để lấy học phí (1-12)
   * Bắt buộc khi includeTuition = true
   */
  @IsOptionalInt('Tháng học phí', 1, 12)
  tuitionMonth?: number

  /**
   * Năm để lấy học phí (2000-2100)
   * Bắt buộc khi includeTuition = true
   */
  @IsOptionalInt('Năm học phí', 2000, 2100)
  tuitionYear?: number

  /** Include homework submit section (default: false) */
  @IsOptionalBoolean('Bao gồm phần bài tập về nhà')
  includeHomework?: boolean = false

  /**
   * ID của HomeworkContent cần lấy bài nộp
   * Bắt buộc khi includeHomework = true
   */
  @IsOptionalInt('ID bài tập về nhà', 1)
  homeworkContentId?: number
}
