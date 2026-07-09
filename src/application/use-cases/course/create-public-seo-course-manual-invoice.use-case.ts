import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import {
  PublicSeoCourseManualInvoiceResponseDto,
  PublicSeoCourseManualInvoiceStatusResponseDto,
  PublicSeoCourseManualInvoiceStatusWithCredentialDto,
  PublicSeoCourseManualInvoiceWithCredentialDto,
} from 'src/application/dtos/course/public-seo-course.dto'
import type { Course, Student, User } from 'src/domain/entities'
import type { OnlineCourseInvoice } from 'src/domain/entities/online-course-payment'
import type { IUnitOfWork, UnitOfWorkRepos } from 'src/domain/repositories'
import { PasswordService } from 'src/infrastructure/services'
import { createEnrollmentsForPaidOnlineCourseInvoice } from '../online-course-payment/online-course-invoice-enrollment.helper'
import {
  CourseEnrollmentStatus,
  CourseType,
  CourseVisibility,
  OnlineCourseInvoiceStatus,
  OnlinePaymentAttemptStatus,
  OnlinePaymentProvider,
} from 'src/shared/enums'

@Injectable()
export class CreatePublicSeoCourseManualInvoiceUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    @Inject('PASSWORD_SERVICE')
    private readonly passwordService: PasswordService,
  ) {}

  async executeWithCredential(
    courseIdOrCode: string,
    dto: PublicSeoCourseManualInvoiceWithCredentialDto,
  ): Promise<BaseResponseDto<PublicSeoCourseManualInvoiceResponseDto>> {
    return this.unitOfWork.executeInTransaction(
      async (repos) => {
        const { user, student } = await this.verifyStudentCredential(repos, dto)
        const result = await this.createOrReusePendingInvoice(repos, courseIdOrCode, user, student, 'PUBLIC_SEO_CREDENTIAL')

        return BaseResponseDto.success(result.message, result)
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }

  async executeForLoggedInUser(
    courseIdOrCode: string,
    userId: number,
  ): Promise<BaseResponseDto<PublicSeoCourseManualInvoiceResponseDto>> {
    return this.unitOfWork.executeInTransaction(
      async (repos) => {
        const user = await repos.userRepository.findById(userId)
        const student = await repos.studentRepository.findByUserId(userId)

        if (!user || !student || !user.isActive) {
          throw new UnauthorizedException('Tai khoan hoc sinh khong hop le hoac da bi khoa')
        }

        const result = await this.createOrReusePendingInvoice(repos, courseIdOrCode, user, student, 'PUBLIC_SEO_AUTH')

        return BaseResponseDto.success(result.message, result)
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }

  async executeStatusWithCredential(
    courseIdOrCode: string,
    dto: PublicSeoCourseManualInvoiceStatusWithCredentialDto,
  ): Promise<BaseResponseDto<PublicSeoCourseManualInvoiceStatusResponseDto>> {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const { user, student } = await this.verifyStudentCredential(repos, dto)
      const course = await this.findPublicOnlineCourse(repos, courseIdOrCode)
      const invoice = await repos.onlineCourseInvoiceRepository.findById(dto.invoiceId)

      if (!invoice || invoice.buyerUserId !== user.userId || invoice.studentId !== student.studentId) {
        throw new NotFoundException('Khong tim thay hoa don')
      }

      const hasCourseItem = (invoice.items ?? []).some((item) => item.courseId === course.courseId)
      if (!hasCourseItem) {
        throw new NotFoundException('Hoa don khong thuoc khoa hoc nay')
      }

      return BaseResponseDto.success(
        'Lay trang thai hoa don chuyen khoan thu cong thanh cong',
        this.toStatusResponse(invoice),
      )
    })
  }

  private async verifyStudentCredential(
    repos: UnitOfWorkRepos,
    dto: PublicSeoCourseManualInvoiceWithCredentialDto,
  ): Promise<{ user: User; student: Student }> {
    if (!dto.username && !dto.email) {
      throw new BadRequestException('Vui long truyen username hoac email')
    }

    if (dto.username && dto.email) {
      throw new BadRequestException('Chi duoc truyen username hoac email, khong truyen ca hai')
    }

    const userWithDetails = dto.username
      ? await repos.userRepository.findByUsernameWithDetails(dto.username)
      : await repos.userRepository.findByEmailWithDetails(dto.email!)

    if (!userWithDetails?.user || !userWithDetails.student) {
      throw new UnauthorizedException('Tai khoan hoac mat khau khong dung')
    }

    if (!userWithDetails.user.isActive) {
      throw new UnauthorizedException('Tai khoan nay da bi khoa')
    }

    const isPasswordValid = await this.passwordService.comparePassword(dto.password, userWithDetails.user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Tai khoan hoac mat khau khong dung')
    }

    return {
      user: userWithDetails.user,
      student: userWithDetails.student,
    }
  }

  private async createOrReusePendingInvoice(
    repos: UnitOfWorkRepos,
    courseIdOrCode: string,
    user: User,
    student: Student,
    source: 'PUBLIC_SEO_CREDENTIAL' | 'PUBLIC_SEO_AUTH',
  ): Promise<PublicSeoCourseManualInvoiceResponseDto> {
    const course = await this.findPublicOnlineCourse(repos, courseIdOrCode)

    const existingEnrollment = await repos.courseEnrollmentRepository.findByCourseAndStudent(
      course.courseId,
      student.studentId,
    )
    if (existingEnrollment?.status === CourseEnrollmentStatus.ACTIVE) {
      const latestInvoice = await repos.onlineCourseInvoiceRepository.findLatestByStudentAndCourse(
        student.studentId,
        course.courseId,
      )

      if (latestInvoice) {
        return this.toResponse(latestInvoice, true, false, 'Hoc sinh da duoc kich hoat khoa hoc nay')
      }

      if (course.priceVND <= 0) {
        return this.createFreePaidInvoice(repos, course, user, student, source, existingEnrollment.enrollmentId)
      }

      throw new BadRequestException('Hoc sinh da duoc kich hoat khoa hoc nay')
    }

    const pendingInvoice = await repos.onlineCourseInvoiceRepository.findPendingByStudentAndCourse(
      student.studentId,
      course.courseId,
    )
    if (pendingInvoice) {
      return this.toResponse(pendingInvoice, false, true, 'Da co hoa don dang cho thanh toan cho khoa hoc nay')
    }

    if (course.priceVND <= 0) {
      return this.createFreePaidInvoice(repos, course, user, student, source)
    }

    const invoice = await repos.onlineCourseInvoiceRepository.create({
      invoiceCode: this.generateInvoiceCode(course.courseId, student.studentId),
      buyerUserId: user.userId,
      studentId: student.studentId,
      status: OnlineCourseInvoiceStatus.PENDING_PAYMENT,
      currency: 'VND',
      subtotalAmount: course.priceVND,
      discountAmount: 0,
      totalAmount: course.priceVND,
      paidAmount: 0,
      refundedAmount: 0,
      paymentProvider: OnlinePaymentProvider.BANK_TRANSFER,
      notes: 'Hoa don chuyen khoan thu cong tao tu trang SEO',
      metadata: {
        source,
        courseId: course.courseId,
        courseCode: course.code,
      },
    })

    await repos.onlineCourseInvoiceItemRepository.create({
      invoiceId: invoice.invoiceId,
      courseId: course.courseId,
      courseCode: course.code,
      courseTitle: course.title,
      unitPriceAmount: course.priceVND,
      quantity: 1,
      discountAmount: 0,
      totalAmount: course.priceVND,
      metadata: {
        source,
      },
    })

    const invoiceWithItems = await repos.onlineCourseInvoiceRepository.findById(invoice.invoiceId)

    return this.toResponse(
      invoiceWithItems ?? invoice,
      false,
      false,
      'Tao hoa don chuyen khoan thu cong thanh cong',
    )
  }

  private async createFreePaidInvoice(
    repos: UnitOfWorkRepos,
    course: Course,
    user: User,
    student: Student,
    source: 'PUBLIC_SEO_CREDENTIAL' | 'PUBLIC_SEO_AUTH',
    existingEnrollmentId?: number,
  ): Promise<PublicSeoCourseManualInvoiceResponseDto> {
    const now = new Date()
    const invoice = await repos.onlineCourseInvoiceRepository.create({
      invoiceCode: this.generateInvoiceCode(course.courseId, student.studentId),
      buyerUserId: user.userId,
      studentId: student.studentId,
      status: OnlineCourseInvoiceStatus.PAID,
      currency: 'VND',
      subtotalAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      paidAmount: 0,
      refundedAmount: 0,
      paymentProvider: OnlinePaymentProvider.OTHER,
      paidAt: now,
      notes: 'Hoa don khoa hoc mien phi tao tu trang SEO',
      metadata: {
        source,
        paymentType: 'FREE',
        courseId: course.courseId,
        courseCode: course.code,
      },
    })

    await repos.onlineCourseInvoiceItemRepository.create({
      invoiceId: invoice.invoiceId,
      courseId: course.courseId,
      enrollmentId: existingEnrollmentId,
      courseCode: course.code,
      courseTitle: course.title,
      unitPriceAmount: 0,
      quantity: 1,
      discountAmount: 0,
      totalAmount: 0,
      metadata: {
        source,
        paymentType: 'FREE',
      },
    })

    const attemptCode = `FREE_${invoice.invoiceId}_${Date.now()}`
    await repos.onlineCoursePaymentAttemptRepository.create({
      invoiceId: invoice.invoiceId,
      attemptCode,
      provider: OnlinePaymentProvider.OTHER,
      status: OnlinePaymentAttemptStatus.SUCCEEDED,
      amount: 0,
      currency: 'VND',
      providerOrderId: attemptCode,
      providerResponseCode: 'FREE_COURSE',
      providerMessage: 'Free course auto confirmed',
      requestPayload: {
        source,
        paymentType: 'FREE',
        courseId: course.courseId,
        courseCode: course.code,
      },
      responsePayload: {
        success: true,
        amount: 0,
      },
      paidAt: now,
    })

    const invoiceWithItems = await repos.onlineCourseInvoiceRepository.findById(invoice.invoiceId)
    if (invoiceWithItems) {
      await createEnrollmentsForPaidOnlineCourseInvoice(repos, invoiceWithItems)
    }

    const paidInvoice = await repos.onlineCourseInvoiceRepository.findById(invoice.invoiceId)

    return this.toResponse(
      paidInvoice ?? invoiceWithItems ?? invoice,
      true,
      false,
      'Khoa hoc mien phi da duoc kich hoat thanh cong',
    )
  }

  private async findPublicOnlineCourse(repos: UnitOfWorkRepos, courseIdOrCode: string): Promise<Course> {
    const course = /^\d+$/.test(courseIdOrCode)
      ? await repos.courseRepository.findById(Number(courseIdOrCode))
      : await repos.courseRepository.findByCode(courseIdOrCode)

    if (!course) {
      throw new NotFoundException('Khong tim thay khoa hoc online public')
    }

    if (course.visibility !== CourseVisibility.PUBLISHED || course.isEnded || !course.isOnline()) {
      throw new BadRequestException('Khoa hoc khong hop le de dang ky tu trang SEO')
    }

    if (![CourseType.ONLINE, CourseType.ALL].includes(course.courseType)) {
      throw new BadRequestException('Chi ho tro tao hoa don cho khoa hoc online hoac all')
    }

    return course
  }

  private generateInvoiceCode(courseId: number, studentId: number): string {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase()
    return `OC${Date.now()}${courseId}${studentId}${random}`.slice(0, 50)
  }

  private toResponse(
    invoice: OnlineCourseInvoice,
    alreadyHasEnrollment: boolean,
    reusedPendingInvoice: boolean,
    message: string,
  ): PublicSeoCourseManualInvoiceResponseDto {
    return {
      invoiceId: invoice.invoiceId,
      invoiceCode: invoice.invoiceCode,
      buyerUserId: invoice.buyerUserId,
      studentId: invoice.studentId,
      status: invoice.status,
      currency: invoice.currency,
      subtotalAmount: invoice.subtotalAmount,
      discountAmount: invoice.discountAmount,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      paymentProvider: invoice.paymentProvider ?? null,
      providerOrderId: invoice.providerOrderId ?? null,
      items: (invoice.items ?? []).map((item) => ({
        invoiceItemId: item.invoiceItemId,
        courseId: item.courseId ?? null,
        courseCode: item.courseCode ?? null,
        courseTitle: item.courseTitle,
        unitPriceAmount: item.unitPriceAmount,
        quantity: item.quantity,
        discountAmount: item.discountAmount,
        totalAmount: item.totalAmount,
        enrollmentId: item.enrollmentId ?? null,
      })),
      alreadyHasEnrollment,
      reusedPendingInvoice,
      message,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    }
  }

  private toStatusResponse(invoice: OnlineCourseInvoice): PublicSeoCourseManualInvoiceStatusResponseDto {
    const latestAttempt = [...(invoice.paymentAttempts ?? [])].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0]
    const payableItems = invoice.items?.filter((item) => item.courseId) ?? []
    const enrollmentCreated =
      invoice.status === OnlineCourseInvoiceStatus.PAID &&
      payableItems.length > 0 &&
      payableItems.every((item) => Boolean(item.enrollmentId))

    return {
      invoiceId: invoice.invoiceId,
      invoiceCode: invoice.invoiceCode,
      status: invoice.status,
      paidAt: invoice.paidAt ?? null,
      paidAmount: invoice.paidAmount,
      paymentProvider: invoice.paymentProvider ?? null,
      latestAttempt: latestAttempt
        ? {
            attemptCode: latestAttempt.attemptCode,
            status: latestAttempt.status,
            provider: latestAttempt.provider,
          }
        : null,
      enrollmentCreated,
    }
  }
}
