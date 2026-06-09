import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { MinioService } from 'src/infrastructure/services/minio.service'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { HardDeleteStudentsByGraduationYearGradeExcludedCoursesDto } from 'src/application/dtos/student/hard-delete-students-by-graduation-year-grade-excluded-courses.dto'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { USER_MEDIA_FIELDS } from 'src/shared/constants/media-field-name.constants'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'

interface StudentDeleteTarget {
  studentId: number
  userId: number
}

interface AvatarFileTarget {
  mediaId: number
  bucketName: string
  objectKey: string
  originalName?: string
  mimeType?: string
  mediaStatus?: string
}

interface AvatarFileDeleteResult extends AvatarFileTarget {
  status: 'deleted' | 'failed'
  reason?: string
}

interface HardDeleteStudentsResult {
  highSchoolGraduationYear: number
  grade: number
  courseIds: number[]
  totalMatchedByGradeAndGraduationYear: number
  protectedByCourseCount: number
  totalCandidates: number
  deletedStudentsCount: number
  deletedUsersCount: number
  deletedAvatarMediaCount: number
  deletedAvatarFilesCount: number
  failedAvatarFilesCount: number
  skippedSharedAvatarMediaCount: number
  deleteCounts: Record<string, number>
  deletedStudents: StudentDeleteTarget[]
  avatarFileResults: AvatarFileDeleteResult[]
}

@Injectable()
export class HardDeleteStudentsByGraduationYearGradeExcludedCoursesUseCase {
  private readonly logger = new Logger(HardDeleteStudentsByGraduationYearGradeExcludedCoursesUseCase.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  async execute(
    dto: HardDeleteStudentsByGraduationYearGradeExcludedCoursesDto,
    adminId?: number,
  ): Promise<BaseResponseDto<HardDeleteStudentsResult>> {
    const courseIds = Array.from(new Set(dto.courseIds.map((id) => Number(id)))).filter(
      (id) => Number.isInteger(id) && id > 0,
    )
    const resourceId = this.buildAuditResourceId(dto)

    if (!adminId) {
      throw new BadRequestException('Không xác định được admin thực hiện thao tác xóa học sinh')
    }

    let transactionResult: Awaited<ReturnType<typeof this.deleteStudentsInTransaction>>

    try {
      if (!courseIds.length) {
        throw new BadRequestException('courseIds không được để trống')
      }

      if (dto.grade < 1 || dto.grade > 12) {
        throw new BadRequestException('Khối lớp phải nằm trong khoảng từ 1 đến 12')
      }

      if (dto.highSchoolGraduationYear < 1900 || dto.highSchoolGraduationYear > 2100) {
        throw new BadRequestException('Năm tốt nghiệp cấp 3 không hợp lệ')
      }

      await this.assertCoursesExist(courseIds)
      transactionResult = await this.deleteStudentsInTransaction(dto, courseIds, adminId, resourceId)
    } catch (error) {
      await this.createFailAuditLog(adminId, resourceId, dto, courseIds, error)
      throw error
    }

    const avatarFileResults = await this.deleteAvatarFiles(transactionResult.avatarFilesToDelete)
    const deletedAvatarFilesCount = avatarFileResults.filter((result) => result.status === 'deleted').length
    const failedAvatarFilesCount = avatarFileResults.filter((result) => result.status === 'failed').length

    const responseData: HardDeleteStudentsResult = {
      highSchoolGraduationYear: dto.highSchoolGraduationYear,
      grade: dto.grade,
      courseIds,
      totalMatchedByGradeAndGraduationYear: transactionResult.totalMatchedByGradeAndGraduationYear,
      protectedByCourseCount: transactionResult.protectedByCourseCount,
      totalCandidates: transactionResult.deletedStudents.length,
      deletedStudentsCount: transactionResult.deleteCounts.students,
      deletedUsersCount: transactionResult.deleteCounts.users,
      deletedAvatarMediaCount: transactionResult.deleteCounts.avatarMedia,
      deletedAvatarFilesCount,
      failedAvatarFilesCount,
      skippedSharedAvatarMediaCount: transactionResult.skippedSharedAvatarMediaCount,
      deleteCounts: transactionResult.deleteCounts,
      deletedStudents: transactionResult.deletedStudents,
      avatarFileResults,
    }

    await this.updateSuccessAuditLogAfterFileDeletion(transactionResult.auditLogId, responseData)

    return BaseResponseDto.success('Hard delete học sinh thành công', responseData)
  }

  private async deleteStudentsInTransaction(
    dto: HardDeleteStudentsByGraduationYearGradeExcludedCoursesDto,
    courseIds: number[],
    adminId: number,
    resourceId: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const baseStudentWhere = {
          grade: dto.grade,
          highSchoolGraduationYear: dto.highSchoolGraduationYear,
        }

        const targetStudentWhere = {
          ...baseStudentWhere,
          courseEnrollments: {
            none: {
              courseId: {
                in: courseIds,
              },
            },
          },
          classStudents: {
            none: {
              courseClass: {
                courseId: {
                  in: courseIds,
                },
              },
            },
          },
        }

        const totalMatchedByGradeAndGraduationYear = await tx.student.count({
          where: baseStudentWhere,
        })

        const students = await tx.student.findMany({
          where: targetStudentWhere,
          select: {
            studentId: true,
            userId: true,
            studentPhone: true,
            parentPhone: true,
            studentZaloId: true,
            parentZaloId: true,
            grade: true,
            school: true,
            highSchoolGraduationYear: true,
            conversationMode: true,
            lastAdminReplyAt: true,
            user: {
              select: {
                userId: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                gender: true,
                dateOfBirth: true,
                isActive: true,
                totalPoint: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                isEmailVerified: true,
                emailVerifiedAt: true,
              },
            },
          },
          orderBy: {
            studentId: 'asc',
          },
        })

        const protectedByCourseCount = totalMatchedByGradeAndGraduationYear - students.length

        if (!students.length) {
          return {
            totalMatchedByGradeAndGraduationYear,
            protectedByCourseCount,
            deletedStudents: [],
            avatarFilesToDelete: [] as AvatarFileTarget[],
            skippedSharedAvatarMediaCount: 0,
            deleteCounts: this.emptyDeleteCounts(),
            auditLogId: await this.createSuccessAuditLog(tx, {
              adminId,
              resourceId,
              dto,
              courseIds,
              totalMatchedByGradeAndGraduationYear,
              protectedByCourseCount,
              studentsBeforeDelete: [],
              deleteCounts: this.emptyDeleteCounts(),
              avatarFilesToDelete: [],
              skippedSharedAvatarMediaCount: 0,
            }),
          }
        }

        const studentIds = students.map((student) => student.studentId)
        const userIds = students.map((student) => student.userId)

        const examAttempts = await tx.examAttempt.findMany({
          where: {
            studentId: {
              in: studentIds,
            },
          },
          select: {
            attemptId: true,
          },
        })
        const examAttemptIds = examAttempts.map((attempt) => attempt.attemptId)

        const competitionSubmits = await tx.competitionSubmit.findMany({
          where: {
            studentId: {
              in: studentIds,
            },
          },
          select: {
            competitionSubmitId: true,
          },
        })
        const competitionSubmitIds = competitionSubmits.map((submit) => submit.competitionSubmitId)

        const avatarUsages = await tx.mediaUsage.findMany({
          where: {
            entityType: EntityType.USER,
            entityId: {
              in: userIds,
            },
            fieldName: USER_MEDIA_FIELDS.AVATAR,
          },
          include: {
            media: {
              select: {
                mediaId: true,
                bucketName: true,
                objectKey: true,
                originalName: true,
                mimeType: true,
                status: true,
              },
            },
          },
        })

        const avatarMediaIds = Array.from(new Set(avatarUsages.map((usage) => usage.mediaId)))
        const selectedUsageCountByMediaId = new Map<number, number>()
        const avatarMediaById = new Map<number, AvatarFileTarget>()

        for (const usage of avatarUsages) {
          selectedUsageCountByMediaId.set(usage.mediaId, (selectedUsageCountByMediaId.get(usage.mediaId) ?? 0) + 1)
          avatarMediaById.set(usage.media.mediaId, {
            mediaId: usage.media.mediaId,
            bucketName: usage.media.bucketName,
            objectKey: usage.media.objectKey,
            originalName: usage.media.originalName,
            mimeType: usage.media.mimeType,
            mediaStatus: usage.media.status,
          })
        }

        const totalUsageCountByMediaId = new Map<number, number>()
        if (avatarMediaIds.length) {
          const usageCounts = await tx.mediaUsage.groupBy({
            by: ['mediaId'],
            where: {
              mediaId: {
                in: avatarMediaIds,
              },
            },
            _count: {
              _all: true,
            },
          })

          for (const usageCount of usageCounts) {
            totalUsageCountByMediaId.set(usageCount.mediaId, usageCount._count._all)
          }
        }

        const deletableAvatarMediaIds = avatarMediaIds.filter((mediaId) => {
          const totalUsageCount = totalUsageCountByMediaId.get(mediaId) ?? 0
          const selectedUsageCount = selectedUsageCountByMediaId.get(mediaId) ?? 0
          return totalUsageCount === selectedUsageCount
        })
        const deletableAvatarMediaIdSet = new Set(deletableAvatarMediaIds)
        const sharedAvatarUsageIds = avatarUsages
          .filter((usage) => !deletableAvatarMediaIdSet.has(usage.mediaId))
          .map((usage) => usage.usageId)
        const skippedSharedAvatarMediaCount = avatarMediaIds.length - deletableAvatarMediaIds.length
        const avatarFilesToDelete = deletableAvatarMediaIds
          .map((mediaId) => avatarMediaById.get(mediaId))
          .filter((media): media is AvatarFileTarget => Boolean(media))

        const deleteCounts = this.emptyDeleteCounts()

        deleteCounts.questionAnswers = examAttemptIds.length
          ? (
              await tx.questionAnswer.deleteMany({
                where: {
                  attemptId: {
                    in: examAttemptIds,
                  },
                },
              })
            ).count
          : 0

        deleteCounts.competitionAnswers = competitionSubmitIds.length
          ? (
              await tx.competitionAnswer.deleteMany({
                where: {
                  competitionSubmitId: {
                    in: competitionSubmitIds,
                  },
                },
              })
            ).count
          : 0

        deleteCounts.homeworkSubmits = (
          await tx.homeworkSubmit.deleteMany({
            where: {
              studentId: {
                in: studentIds,
              },
            },
          })
        ).count

        deleteCounts.studentLearningItems = (
          await tx.studentLearningItem.deleteMany({
            where: {
              studentId: {
                in: studentIds,
              },
            },
          })
        ).count

        deleteCounts.attendances = (
          await tx.attendance.deleteMany({
            where: {
              studentId: {
                in: studentIds,
              },
            },
          })
        ).count

        deleteCounts.classStudents = (
          await tx.classStudent.deleteMany({
            where: {
              studentId: {
                in: studentIds,
              },
            },
          })
        ).count

        deleteCounts.courseEnrollments = (
          await tx.courseEnrollment.deleteMany({
            where: {
              studentId: {
                in: studentIds,
              },
            },
          })
        ).count

        deleteCounts.tuitionPayments = (
          await tx.tuitionPayment.deleteMany({
            where: {
              studentId: {
                in: studentIds,
              },
            },
          })
        ).count

        deleteCounts.studentPointLogs = (
          await tx.studentPointLog.deleteMany({
            where: {
              studentId: {
                in: studentIds,
              },
            },
          })
        ).count

        deleteCounts.examAttempts = examAttemptIds.length
          ? (
              await tx.examAttempt.deleteMany({
                where: {
                  attemptId: {
                    in: examAttemptIds,
                  },
                },
              })
            ).count
          : 0

        deleteCounts.competitionSubmits = competitionSubmitIds.length
          ? (
              await tx.competitionSubmit.deleteMany({
                where: {
                  competitionSubmitId: {
                    in: competitionSubmitIds,
                  },
                },
              })
            ).count
          : 0

        deleteCounts.sharedAvatarUsages = sharedAvatarUsageIds.length
          ? (
              await tx.mediaUsage.deleteMany({
                where: {
                  usageId: {
                    in: sharedAvatarUsageIds,
                  },
                },
              })
            ).count
          : 0

        deleteCounts.avatarMedia = deletableAvatarMediaIds.length
          ? (
              await tx.media.deleteMany({
                where: {
                  mediaId: {
                    in: deletableAvatarMediaIds,
                  },
                },
              })
            ).count
          : 0

        deleteCounts.students = (
          await tx.student.deleteMany({
            where: {
              studentId: {
                in: studentIds,
              },
            },
          })
        ).count

        deleteCounts.users = (
          await tx.user.deleteMany({
            where: {
              userId: {
                in: userIds,
              },
            },
          })
        ).count

        const deletedStudents = students.map((student) => ({
          studentId: student.studentId,
          userId: student.userId,
        }))

        const auditLogId = await this.createSuccessAuditLog(tx, {
          adminId,
          resourceId,
          dto,
          courseIds,
          totalMatchedByGradeAndGraduationYear,
          protectedByCourseCount,
          studentsBeforeDelete: students,
          deleteCounts,
          avatarFilesToDelete,
          skippedSharedAvatarMediaCount,
        })

        return {
          totalMatchedByGradeAndGraduationYear,
          protectedByCourseCount,
          deletedStudents,
          avatarFilesToDelete,
          skippedSharedAvatarMediaCount,
          deleteCounts,
          auditLogId,
        }
      },
      {
        maxWait: 10000,
        timeout: 120000,
      },
    )
  }

  private async assertCoursesExist(courseIds: number[]): Promise<void> {
    const courses = await this.prisma.course.findMany({
      where: {
        courseId: {
          in: courseIds,
        },
      },
      select: {
        courseId: true,
      },
    })

    const existingCourseIds = new Set(courses.map((course) => course.courseId))
    const missingCourseIds = courseIds.filter((courseId) => !existingCourseIds.has(courseId))

    if (missingCourseIds.length) {
      throw new BadRequestException(`courseIds không tồn tại: ${missingCourseIds.join(', ')}`)
    }
  }

  private async deleteAvatarFiles(files: AvatarFileTarget[]): Promise<AvatarFileDeleteResult[]> {
    const results: AvatarFileDeleteResult[] = []

    for (const file of files) {
      try {
        await this.minioService.deleteFile(file.bucketName, file.objectKey)
        results.push({
          ...file,
          status: 'deleted',
        })
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error'
        this.logger.error(
          `Failed to delete avatar file mediaId=${file.mediaId}, path=${file.bucketName}/${file.objectKey}: ${reason}`,
        )
        results.push({
          ...file,
          status: 'failed',
          reason,
        })
      }
    }

    return results
  }

  private async createSuccessAuditLog(
    tx: any,
    data: {
      adminId: number
      resourceId: string
      dto: HardDeleteStudentsByGraduationYearGradeExcludedCoursesDto
      courseIds: number[]
      totalMatchedByGradeAndGraduationYear: number
      protectedByCourseCount: number
      studentsBeforeDelete: any[]
      deleteCounts: Record<string, number>
      avatarFilesToDelete: AvatarFileTarget[]
      skippedSharedAvatarMediaCount: number
    },
  ): Promise<number> {
    const deletedStudents = data.studentsBeforeDelete.map((student) => ({
      studentId: student.studentId,
      userId: student.userId,
    }))

    const auditLog = await tx.adminAuditLog.create({
      data: {
        adminId: data.adminId,
        actionKey: ACTION_KEYS.STUDENT.DELETE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.STUDENT,
        resourceId: data.resourceId,
        beforeData: this.toJsonData({
          input: {
            highSchoolGraduationYear: data.dto.highSchoolGraduationYear,
            grade: data.dto.grade,
            courseIds: data.courseIds,
          },
          rules: [
            'Chỉ xóa học sinh khớp năm tốt nghiệp và khối.',
            'Không xóa học sinh có course enrollment thuộc courseIds.',
            'Không xóa học sinh đang nằm trong lớp thuộc courseIds.',
            'Chỉ hard delete avatar media nếu media không còn usage khác.',
          ],
          totalMatchedByGradeAndGraduationYear: data.totalMatchedByGradeAndGraduationYear,
          protectedByCourseCount: data.protectedByCourseCount,
          totalCandidates: data.studentsBeforeDelete.length,
          studentsBeforeDelete: data.studentsBeforeDelete,
        }),
        afterData: this.toJsonData({
          stage: 'DB_DELETED_AVATAR_FILE_DELETE_PENDING',
          deleteCounts: data.deleteCounts,
          deletedStudents,
          avatarFilesToDelete: data.avatarFilesToDelete,
          skippedSharedAvatarMediaCount: data.skippedSharedAvatarMediaCount,
        }),
      },
    })

    return auditLog.logId
  }

  private async updateSuccessAuditLogAfterFileDeletion(
    auditLogId: number | undefined,
    responseData: HardDeleteStudentsResult,
  ): Promise<void> {
    if (!auditLogId) return

    const hasAvatarFileFailures = responseData.failedAvatarFilesCount > 0

    try {
      await this.prisma.adminAuditLog.update({
        where: {
          logId: auditLogId,
        },
        data: {
          status: hasAvatarFileFailures ? AuditStatus.FAIL : AuditStatus.SUCCESS,
          errorMessage: hasAvatarFileFailures
            ? `Đã xóa dữ liệu DB nhưng có ${responseData.failedAvatarFilesCount} file avatar xóa thất bại trên MinIO`
            : null,
          afterData: this.toJsonData({
            stage: 'COMPLETED',
            ...responseData,
          }),
        },
      })
    } catch (error) {
      this.logger.error(`Failed to update admin audit log ${auditLogId}: ${this.getErrorMessage(error)}`)
    }
  }

  private async createFailAuditLog(
    adminId: number,
    resourceId: string,
    dto: HardDeleteStudentsByGraduationYearGradeExcludedCoursesDto,
    courseIds: number[],
    error: unknown,
  ): Promise<void> {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          adminId,
          actionKey: ACTION_KEYS.STUDENT.DELETE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.STUDENT,
          resourceId,
          errorMessage: this.getErrorMessage(error),
          beforeData: this.toJsonData({
            input: {
              highSchoolGraduationYear: dto.highSchoolGraduationYear,
              grade: dto.grade,
              courseIds: dto.courseIds,
            },
            normalizedCourseIds: courseIds,
          }),
        },
      })
    } catch (auditError) {
      this.logger.error(`Failed to create failed admin audit log: ${this.getErrorMessage(auditError)}`)
    }
  }

  private buildAuditResourceId(dto: HardDeleteStudentsByGraduationYearGradeExcludedCoursesDto): string {
    return `bulk:${dto.highSchoolGraduationYear ?? 'unknown'}:${dto.grade ?? 'unknown'}`
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error'
  }

  private toJsonData(data: unknown): any {
    return JSON.parse(
      JSON.stringify(data, (_key, value) => {
        if (typeof value === 'bigint') {
          return value.toString()
        }

        return value
      }),
    )
  }

  private emptyDeleteCounts(): Record<string, number> {
    return {
      questionAnswers: 0,
      competitionAnswers: 0,
      homeworkSubmits: 0,
      studentLearningItems: 0,
      attendances: 0,
      classStudents: 0,
      courseEnrollments: 0,
      tuitionPayments: 0,
      studentPointLogs: 0,
      examAttempts: 0,
      competitionSubmits: 0,
      sharedAvatarUsages: 0,
      avatarMedia: 0,
      students: 0,
      users: 0,
    }
  }
}
