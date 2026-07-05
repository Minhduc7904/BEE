import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionSubmitRepository } from 'src/domain/repositories/competition-submit.repository'
import { ExcelColumn, ExcelService } from 'src/infrastructure/services/excel.service'
import { Gender } from 'src/shared/enums'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { ExportCompetitionSubmitScoreListOptionDto } from '../../dtos/competition-submit'

@Injectable()
export class ExportCompetitionSubmitScoreListUseCase {
  constructor(
    @Inject('ICompetitionSubmitRepository')
    private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
    private readonly excelService: ExcelService,
  ) {}

  async execute(options: ExportCompetitionSubmitScoreListOptionDto): Promise<{
    buffer: Buffer
    filename: string
  }> {
    const filters = options.toCompetitionSubmitFilterOptions()
    const pagination = options.toCompetitionSubmitPaginationOptions()
    pagination.limit = 10000

    const result = await this.competitionSubmitRepository.findForScoreExport(filters, pagination)

    if (result.competitionSubmits.length === 0) {
      throw new NotFoundException('Khong tim thay du lieu bai nop competition de xuat file')
    }

    const allClasses = Array.from(
      new Set(
        result.competitionSubmits.flatMap(
          (submit: any) =>
            submit.student?.classStudents
              ?.map((classStudent: any) => classStudent.courseClass?.className)
              .filter(Boolean) || [],
        ),
      ),
    )

    const questionColumns = result.questions.map((question, index) => ({
      ...question,
      header: `Cau ${index + 1}`,
      key: `question_${question.questionId}`,
    }))

    const excelData = result.competitionSubmits.map((submit: any, index: number) => {
      const student = submit.student
      const user = student?.user
      const studentClasses = new Set(
        student?.classStudents?.map((classStudent: any) => classStudent.courseClass?.className).filter(Boolean) || [],
      )
      const classColumns = Object.fromEntries(
        allClasses.map((className) => [className, studentClasses.has(className) ? 'v' : '']),
      )
      const answerByQuestionId = new Map<number, any>(
        (submit.competitionAnswers || []).map((answer: any) => [answer.questionId, answer]),
      )
      const answerColumns = Object.fromEntries(
        questionColumns.map((question) => [
          question.key,
          this.getQuestionResultCell(answerByQuestionId.get(question.questionId)),
        ]),
      )

      return {
        stt: index + 1,
        studentCode: student?.studentId || '',
        fullName: `${user?.lastName || ''} ${user?.firstName || ''}`.trim(),
        school: student?.school || '',
        gender:
          user?.gender === Gender.MALE ? 'Nam' : user?.gender === Gender.FEMALE ? 'Nu' : user?.gender ? 'Khac' : '',
        dateOfBirth: this.formatDate(user?.dateOfBirth),
        username: user?.username || '',
        parentPhone: student?.parentPhone || '',
        studentPhone: student?.studentPhone || '',
        grade: student?.grade || '',
        highSchoolGraduationYear: student?.highSchoolGraduationYear || '',
        email: user?.email || '',
        isActive: user?.isActive ? 'Hoat dong' : 'Khong hoat dong',
        createdAt: this.formatDateTime(user?.createdAt),
        ...classColumns,
        competitionTitle: submit.competition?.title || '',
        competitionSubmitId: submit.competitionSubmitId || '',
        attemptNumber: submit.attemptNumber || '',
        submitStatus: submit.status || '',
        totalPoints: this.formatNumber(submit.totalPoints),
        maxPoints: this.formatNumber(submit.maxPoints),
        scorePercentage: this.formatScorePercentage(submit.totalPoints, submit.maxPoints),
        timeSpent: this.formatDuration(submit.timeSpentSeconds),
        startedAt: this.formatDateTime(submit.startedAt),
        submittedAt: this.formatDateTime(submit.submittedAt),
        gradedAt: this.formatDateTime(submit.gradedAt),
        feedback: submit.feedback || '',
        ...answerColumns,
      }
    })

    const columns = this.buildColumns(options, allClasses, questionColumns)
    const filename = `Danh_sach_diem_competition_${this.formatDateTime(new Date()).replace(/[/ :]/g, '_')}.xlsx`

    const buffer = await this.excelService.exportToBuffer({
      sheetName: 'Diem competition',
      columns,
      data: excelData,
    })

    return { buffer, filename }
  }

  private buildColumns(
    options: ExportCompetitionSubmitScoreListOptionDto,
    allClasses: string[],
    questionColumns: Array<{ header: string; key: string }>,
  ): ExcelColumn[] {
    const columns: ExcelColumn[] = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Ma hoc sinh', key: 'studentCode', width: 15 },
      { header: 'Ho va ten', key: 'fullName', width: 30 },
    ]

    if (options.includeStudentPhone === true) {
      columns.push({ header: 'SDT hoc sinh', key: 'studentPhone', width: 15 })
    }

    if (options.includeParentPhone !== false) {
      columns.push({ header: 'SDT phu huynh', key: 'parentPhone', width: 15 })
    }

    if (options.includeSchool !== false) {
      columns.push({ header: 'Truong', key: 'school', width: 25 })
    }

    if (options.includeGender === true) {
      columns.push({ header: 'Gioi tinh', key: 'gender', width: 10 })
    }

    if (options.includeDateOfBirth === true) {
      columns.push({ header: 'Ngay sinh', key: 'dateOfBirth', width: 15 })
    }

    if (options.includeUsername !== false) {
      columns.push({ header: 'Ten dang nhap', key: 'username', width: 20 })
    }

    if (options.includeGrade !== false) {
      columns.push({ header: 'Khoi', key: 'grade', width: 10 })
    }

    if (options.includeHighSchoolGraduationYear !== false) {
      columns.push({ header: 'Nam tot nghiep cap 3', key: 'highSchoolGraduationYear', width: 22 })
    }

    if (options.includeEmail !== false) {
      columns.push({ header: 'Email', key: 'email', width: 25 })
    }

    if (options.includeIsActive !== false) {
      columns.push({ header: 'Trang thai', key: 'isActive', width: 15 })
    }

    if (options.includeCreatedAt === true) {
      columns.push({ header: 'Ngay tao', key: 'createdAt', width: 20 })
    }

    allClasses.forEach((className) => {
      columns.push({
        header: className,
        key: className,
        width: 15,
      })
    })

    if (options.includeCompetitionSubmitColumns !== false) {
      columns.push(
        { header: 'Competition', key: 'competitionTitle', width: 30 },
        { header: 'Ma bai nop', key: 'competitionSubmitId', width: 12 },
        { header: 'Lan lam', key: 'attemptNumber', width: 10 },
        { header: 'Trang thai bai nop', key: 'submitStatus', width: 18 },
        { header: 'Diem', key: 'totalPoints', width: 10 },
        { header: 'Diem toi da', key: 'maxPoints', width: 12 },
        { header: 'Ti le diem (%)', key: 'scorePercentage', width: 14 },
        { header: 'Thoi gian lam', key: 'timeSpent', width: 16 },
        { header: 'Bat dau luc', key: 'startedAt', width: 20 },
        { header: 'Nop luc', key: 'submittedAt', width: 20 },
        { header: 'Cham luc', key: 'gradedAt', width: 20 },
        { header: 'Nhan xet', key: 'feedback', width: 30 },
      )
    }

    if (options.includeQuestionColumns !== false) {
      questionColumns.forEach((question) => {
        columns.push({
          header: question.header,
          key: question.key,
          width: 10,
        })
      })
    }

    return columns
  }

  private getQuestionResultCell(answer?: any): string {
    if (!answer || !this.hasAnswer(answer)) {
      return ''
    }

    if (answer.isCorrect === true) {
      return 'v'
    }

    if (answer.isCorrect === false) {
      return 'x'
    }

    return ''
  }

  private hasAnswer(answer: any): boolean {
    const hasTextAnswer = typeof answer.answer === 'string' && answer.answer.trim().length > 0
    const selectedStatementIds = this.parseSelectedStatementIds(answer.selectedStatementIds)

    return hasTextAnswer || selectedStatementIds.length > 0
  }

  private parseSelectedStatementIds(value: unknown): unknown[] {
    if (Array.isArray(value)) {
      return value
    }

    if (typeof value !== 'string' || value.trim().length === 0) {
      return []
    }

    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  private formatDateTime(date?: Date | string | null): string {
    if (!date) return ''
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  private formatDate(date?: Date | string | null): string {
    if (!date) return ''
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  private formatNumber(value?: number | string | null): string {
    if (value === null || value === undefined) return ''
    return String(Number(value))
  }

  private formatScorePercentage(totalPoints?: number | string | null, maxPoints?: number | string | null): string {
    const total = Number(totalPoints ?? 0)
    const max = Number(maxPoints ?? 0)
    if (!max) return ''
    return String(Number(((total / max) * 100).toFixed(2)))
  }

  private formatDuration(seconds?: number | null): string {
    if (!seconds) return ''
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`
  }
}
