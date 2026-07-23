import type { AssistantShift as PrismaAssistantShift, Prisma } from '@prisma/client'

import { AssistantShift } from '../../../domain/entities/assistant-shift'
import { CourseClassMapper } from '../class/course-class.mapper'
import { AssistantShiftAssignmentMapper } from './assistant-shift-assignment.mapper'
import { AssistantShiftSeriesMapper } from './assistant-shift-series.mapper'

type PrismaAssistantShiftWithSeries = Prisma.AssistantShiftGetPayload<{
  include: { series: true }
}>
type PrismaAssistantShiftWithAssignments = Prisma.AssistantShiftGetPayload<{
  include: { assignments: { include: { admin: { include: { user: true } } } } }
}>
type PrismaAssistantShiftWithDetails = Prisma.AssistantShiftGetPayload<{
  include: {
    series: true
    assignments: { include: { admin: { include: { user: true } } } }
  }
}>
type PrismaAssistantShiftWithClassDetails = Prisma.AssistantShiftGetPayload<{
  include: {
    series: true
    courseClass: true
    assignments: { include: { admin: { include: { user: true } } } }
  }
}>

export class AssistantShiftMapper {
  static toDomain(record: PrismaAssistantShift | null | undefined): AssistantShift | null {
    if (!record) return null

    return new AssistantShift({
      assistantShiftId: record.assistantShiftId,
      assistantShiftSeriesId: record.assistantShiftSeriesId,
      classId: record.classId,
      name: record.name,
      notes: record.notes,
      startAt: record.startAt,
      endAt: record.endAt,
      isLocked: record.isLocked,
      selfRegistrationOpenAt: record.selfRegistrationOpenAt,
      selfRegistrationCloseAt: record.selfRegistrationCloseAt,
      requiredAssistantCount: record.requiredAssistantCount,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  static toDomainWithSeries(record: PrismaAssistantShiftWithSeries | null | undefined): AssistantShift | null {
    const shift = this.toDomain(record)
    if (!shift || !record) return null

    shift.series = AssistantShiftSeriesMapper.toDomain(record.series) ?? undefined
    return shift
  }

  static toDomainWithAssignments(
    record: PrismaAssistantShiftWithAssignments | null | undefined,
  ): AssistantShift | null {
    const shift = this.toDomain(record)
    if (!shift || !record) return null

    shift.assignments = AssistantShiftAssignmentMapper.toDomainListWithAdmin(record.assignments)
    return shift
  }

  static toDomainWithDetails(record: PrismaAssistantShiftWithDetails | null | undefined): AssistantShift | null {
    const shift = this.toDomainWithSeries(record)
    if (!shift || !record) return null

    shift.assignments = AssistantShiftAssignmentMapper.toDomainListWithAdmin(record.assignments)
    return shift
  }

  static toDomainWithClassDetails(
    record: PrismaAssistantShiftWithClassDetails | null | undefined,
  ): AssistantShift | null {
    const shift = this.toDomainWithDetails(record)
    if (!shift || !record) return null

    shift.courseClass = CourseClassMapper.toDomainCourseClass(record.courseClass)
    return shift
  }

  static toDomainList(records: PrismaAssistantShift[] | null | undefined): AssistantShift[] {
    if (!records?.length) return []

    return records
      .map((record) => this.toDomain(record))
      .filter((record): record is AssistantShift => record !== null)
  }

  static toDomainListWithDetails(records: PrismaAssistantShiftWithDetails[] | null | undefined): AssistantShift[] {
    if (!records?.length) return []

    return records
      .map((record) => this.toDomainWithDetails(record))
      .filter((record): record is AssistantShift => record !== null)
  }

  static toDomainListWithAssignments(
    records: PrismaAssistantShiftWithAssignments[] | null | undefined,
  ): AssistantShift[] {
    if (!records?.length) return []

    return records
      .map((record) => this.toDomainWithAssignments(record))
      .filter((record): record is AssistantShift => record !== null)
  }

  static toDomainListWithClassDetails(
    records: PrismaAssistantShiftWithClassDetails[] | null | undefined,
  ): AssistantShift[] {
    if (!records?.length) return []

    return records
      .map((record) => this.toDomainWithClassDetails(record))
      .filter((record): record is AssistantShift => record !== null)
  }
}
