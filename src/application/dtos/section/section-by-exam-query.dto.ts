// src/application/dtos/section/section-by-exam-query.dto.ts
import { IsOptional, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO for querying sections by exam
 * 
 * @description Query parameters for fetching sections of a specific exam
 */
export class SectionByExamQueryDto {
  /**
   * Exam ID (from route parameter)
   * This is not a query parameter - it's passed from the route
   */
  examId?: number

  /**
   * Optional: Include question count
   * @optional
   * @example true
   */
  @IsOptional()
  includeQuestions?: boolean
}
