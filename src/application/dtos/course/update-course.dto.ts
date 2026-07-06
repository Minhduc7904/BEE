import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { CourseType, CourseVisibility } from 'src/shared/enums'
import {
  IsOptionalString,
  IsOptionalInt,
  IsOptionalIdNumber,
  IsOptionalEnumValue,
  IsOptionalNumber,
  IsOptionalBoolean,
} from 'src/shared/decorators/validate'

/**
 * DTO cáº­p nháº­t thÃ´ng tin cÆ¡ báº£n khÃ³a há»c
 * @description Chá»©a cÃ¡c trÆ°á»ng thÃ´ng tin cÆ¡ báº£n cÃ³ thá»ƒ cáº­p nháº­t
 */
export class UpdateCourseBasicInfoDto {
  /**
   * TiÃªu Ä‘á» khÃ³a há»c (3-200 kÃ½ tá»±)
   * @optional
   * @example "ToÃ¡n há»c lá»›p 10"
   */
  @IsOptionalString('TiÃªu Ä‘á»', 200, 3)
  title?: string

  /**
   * Phá»¥ Ä‘á» khÃ³a há»c (tá»‘i Ä‘a 255 kÃ½ tá»±)
   * @optional
   * @example "CÆ¡ báº£n vÃ  nÃ¢ng cao"
   */
  @IsOptionalString('Phá»¥ Ä‘á»', 255)
  subtitle?: string

  /**
   * NÄƒm há»c (tá»‘i Ä‘a 9 kÃ½ tá»±)
   * @optional
   * @example "2024-2025"
   */
  @IsOptionalString('NÄƒm há»c', 9)
  academicYear?: string

  /**
   * Khá»‘i lá»›p (1-12)
   * @optional
   * @example 10
   */
  @IsOptionalInt('Khá»‘i', 1, 12)
  grade?: number

  /**
   * ID mÃ´n há»c
   * @optional
   * @example 5
   */
  @IsOptionalIdNumber('MÃ´n há»c')
  subjectId?: number

  /**
   * MÃ´ táº£ khÃ³a há»c
   * @optional
   */
  @IsOptionalString('MÃ´ táº£')
  description?: string

  /**
   * Tráº¡ng thÃ¡i hiá»ƒn thá»‹
   * @optional
   */
  @IsOptionalEnumValue(CourseVisibility, 'Tráº¡ng thÃ¡i')
  visibility?: CourseVisibility

  /**
   * ID giÃ¡o viÃªn
   * @optional
   */
  @IsOptionalIdNumber('GiÃ¡o viÃªn')
  teacherId?: number

  /**
   * KhÃ³a há»c Ä‘Ã£ káº¿t thÃºc chÆ°a
   * @optional
   * @example false
   */
  @IsOptionalBoolean('KhÃ³a há»c Ä‘Ã£ káº¿t thÃºc')
  isEnded?: boolean

  @IsOptionalEnumValue(CourseType, 'LoÃ¡ÂºÂ¡i khÃƒÂ³a hÃ¡Â»Âc')
  courseType?: CourseType
}

/**
 * DTO cáº­p nháº­t thÃ´ng tin giÃ¡ cáº£ khÃ³a há»c
 * @description Chá»©a cÃ¡c trÆ°á»ng vá» giÃ¡, thanh toÃ¡n, há»c phÃ­
 */
export class UpdateCoursePricingDto {
  /**
   * GiÃ¡ khÃ³a há»c (VNÄ)
   * @optional
   * @example 500000
   */
  @IsOptionalNumber('GiÃ¡', 0)
  priceVND?: number

  /**
   * GiÃ¡ gá»‘c (VNÄ)
   * @optional
   * @example 700000
   */
  @IsOptionalNumber('GiÃ¡ gá»‘c', 0)
  compareAtVND?: number
}
