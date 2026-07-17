import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import {
  AchievementRowsImportResultDto,
  AchievementRowResponseDto,
  BaseResponseDto,
} from 'src/application/dtos'
import type { IAchievementBoardRepository } from 'src/domain/repositories'
import { ExcelService } from 'src/application/interfaces'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { ACHIEVEMENT_ROW_EXCEL_HEADERS } from './achievement-excel.constants'

@Injectable()
export class ImportAchievementRowsUseCase {
  constructor(
    @Inject('IAchievementBoardRepository')
    private readonly achievementBoardRepository: IAchievementBoardRepository,
    private readonly excelService: ExcelService,
  ) {}

  async execute(
    achievementBoardId: number,
    file: Express.Multer.File,
  ): Promise<BaseResponseDto<AchievementRowsImportResultDto>> {
    if (!file?.buffer) {
      throw new BadRequestException('File excel la bat buoc')
    }

    const board = await this.achievementBoardRepository.findById(achievementBoardId, false)
    if (!board) {
      throw new NotFoundException('Khong tim thay bang thanh tich')
    }

    const parsed = await this.excelService.parseFromBuffer(file.buffer, {
      expectedColumns: ACHIEVEMENT_ROW_EXCEL_HEADERS,
      skipHeader: true,
      trimValues: true,
    })

    const rows = parsed.data.map((row, index) => this.mapExcelRow(row, index, achievementBoardId))
    const createdRows = await this.achievementBoardRepository.createRows(rows)

    return BaseResponseDto.success('Import dong thanh tich thanh cong', {
      importedCount: createdRows.length,
      rows: AchievementRowResponseDto.fromEntityList(createdRows),
    })
  }

  private mapExcelRow(row: any, index: number, achievementBoardId: number) {
    const studentName = String(row['Ten hoc sinh'] ?? '').trim()
    const schoolName = String(row['Truong'] ?? '').trim()
    const grade = Number(row['Khoi'])
    const score = Number(row['Diem'])

    if (!studentName) {
      throw new BadRequestException(`Dong ${index + 2}: Ten hoc sinh la bat buoc`)
    }

    if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
      throw new BadRequestException(`Dong ${index + 2}: Khoi phai la so nguyen tu 1 den 12`)
    }

    if (Number.isNaN(score) || score < 0) {
      throw new BadRequestException(`Dong ${index + 2}: Diem khong hop le`)
    }

    return {
      achievementBoardId,
      studentName,
      schoolName: schoolName || null,
      grade,
      score,
      sortOrder: index,
    }
  }
}
