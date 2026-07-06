// src/application/dtos/course/create-course.dto.ts
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { CourseType, CourseVisibility } from 'src/shared/enums'
import {
  IsRequiredString,
  IsOptionalString,
  IsOptionalInt,
  IsRequiredNumber,
  IsOptionalNumber,
  IsOptionalEnumValue,
  IsOptionalIdNumber,
  IsOptionalBoolean,
} from 'src/shared/decorators/validate'
/**
 * DTO táº¡o khÃ³a há»c má»›i
 * @description Chá»©a thÃ´ng tin cÆ¡ báº£n Ä‘á»ƒ táº¡o khÃ³a há»c má»›i
 */
export class CreateCourseDto {
  /**
   * TiÃªu Ä‘á» khÃ³a há»c (3-200 kÃ½ tá»±)
   * @required
   * @example "ToÃ¡n há»c lá»›p 10"
   */
  @IsRequiredString('TiÃªu Ä‘á»', 200, 3)
  title: string

  /**
   * Phá»¥ Ä‘á» khÃ³a há»c (tá»‘i Ä‘a 255 kÃ½ tá»±)
   * @optional
   * @example "CÆ¡ báº£n vÃ  nÃ¢ng cao"
   */
  @IsOptionalString('Phá»¥ Ä‘á»', 255)
  subtitle?: string

  /**
   * NÄƒm há»c (tá»‘i Ä‘a 9 kÃ½ tá»±, format: YYYY-YYYY)
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
   * @example "KhÃ³a há»c toÃ¡n cÆ¡ báº£n vÃ  nÃ¢ng cao cho há»c sinh lá»›p 10"
   */
  @IsOptionalString('MÃ´ táº£')
  description?: string

  /**
   * GiÃ¡ khÃ³a há»c (VNÄ, â‰¥ 0)
   * @required
   * @example 500000
   */
  @IsRequiredNumber('GiÃ¡', 0)
  priceVND: number

  /**
   * GiÃ¡ gá»‘c trÆ°á»›c khi giáº£m (VNÄ, â‰¥ 0)
   * @optional
   * @example 700000
   */
  @IsOptionalNumber('GiÃ¡ gá»‘c', 0)
  compareAtVND?: number

  /**
   * Tráº¡ng thÃ¡i hiá»ƒn thá»‹ khÃ³a há»c
   * @optional
   * @example "PUBLIC"
   */
  @IsOptionalEnumValue(CourseVisibility, 'Tráº¡ng thÃ¡i')
  visibility?: CourseVisibility

  /**
   * KhÃ³a há»c Ä‘Ã£ káº¿t thÃºc chÆ°a
   * @optional
   * @example false
   */
  @IsOptionalBoolean('KhÃ³a há»c Ä‘Ã£ káº¿t thÃºc')
  isEnded?: boolean

  @IsOptionalEnumValue(CourseType, 'LoÃ¡ÂºÂ¡i khÃƒÂ³a hÃ¡Â»Âc')
  courseType?: CourseType

  /**
   * ID giÃ¡o viÃªn phá»¥ trÃ¡ch
   * @optional
   * @example 3
   */
  @IsOptionalIdNumber('GiÃ¡o viÃªn')
  teacherId?: number
}
