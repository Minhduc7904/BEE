import type { OnlineCourseInvoice, OnlineCourseInvoiceItem } from 'src/domain/entities/online-course-payment'
import type { UnitOfWorkRepos } from 'src/domain/repositories'
import { CourseEnrollmentStatus } from 'src/shared/enums'

export async function createEnrollmentsForPaidOnlineCourseInvoice(
  repos: UnitOfWorkRepos,
  invoice: OnlineCourseInvoice,
): Promise<void> {
  const items = invoice.items?.filter((item) => item.courseId) ?? []

  for (const item of items) {
    const enrollment = await createOrActivateEnrollment(repos, invoice, item)
    if (!item.enrollmentId || item.enrollmentId !== enrollment.enrollmentId) {
      await repos.onlineCourseInvoiceItemRepository.attachEnrollment(item.invoiceItemId, enrollment.enrollmentId)
    }
  }
}

async function createOrActivateEnrollment(
  repos: UnitOfWorkRepos,
  invoice: OnlineCourseInvoice,
  item: OnlineCourseInvoiceItem,
) {
  const existing = await repos.courseEnrollmentRepository.findByCourseAndStudent(item.courseId!, invoice.studentId)

  if (!existing) {
    return repos.courseEnrollmentRepository.create({
      courseId: item.courseId!,
      studentId: invoice.studentId,
      status: CourseEnrollmentStatus.ACTIVE,
      isPaidFull: true,
    })
  }

  if (
    [CourseEnrollmentStatus.CANCELLED, CourseEnrollmentStatus.BLOCKED_UNPAID, CourseEnrollmentStatus.TRIAL].includes(
      existing.status,
    )
  ) {
    return repos.courseEnrollmentRepository.update(existing.enrollmentId, {
      status: CourseEnrollmentStatus.ACTIVE,
      isPaidFull: true,
    })
  }

  return existing
}
