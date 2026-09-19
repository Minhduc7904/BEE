import { Prisma } from '@prisma/client'
import { Parent } from '../../../domain/entities/user/parent.entity'
import { CreateParentData, ParentRelationOptions } from '../../../domain/interface/parent/parent.interface'
import { IParentRepository } from '../../../domain/repositories/parent.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { NumberUtil } from '../../../shared/utils'
import { ParentMapper } from '../../mappers/user/parent.mapper'
import { UniqueConstraintException } from '../../../shared/exceptions/custom-exceptions'

export class PrismaParentRepository implements IParentRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  private buildInclude(options?: ParentRelationOptions): Prisma.ParentInclude | undefined {
    if (!options?.includeUser && !options?.includeStudents) return undefined

    return {
      user: options.includeUser || options.includeStudents ? true : undefined,
      students: options.includeStudents ? { include: { student: { include: { user: true } } } } : undefined,
    }
  }

  async create(data: CreateParentData): Promise<Parent> {
    let record
    try {
      record = await this.prisma.parent.create({
        data: {
          userId: NumberUtil.ensureValidId(data.userId, 'User ID'),
          phone: data.phone,
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new UniqueConstraintException('Số điện thoại đã đăng ký tài khoản phụ huynh')
      }
      throw error
    }

    return ParentMapper.toDomainParent(record)!
  }

  async findById(parentId: number, options?: ParentRelationOptions): Promise<Parent | null> {
    const record = await this.prisma.parent.findUnique({
      where: { parentId: NumberUtil.ensureValidId(parentId, 'Parent ID') },
      include: this.buildInclude(options),
    })

    return ParentMapper.toDomainParent(record)
  }

  async findByUserId(userId: number, options?: ParentRelationOptions): Promise<Parent | null> {
    const record = await this.prisma.parent.findUnique({
      where: { userId: NumberUtil.ensureValidId(userId, 'User ID') },
      include: this.buildInclude(options),
    })

    return ParentMapper.toDomainParent(record)
  }

  async findByPhone(phone: string, options?: ParentRelationOptions): Promise<Parent | null> {
    const record = await this.prisma.parent.findUnique({
      where: { phone },
      include: this.buildInclude(options),
    })

    return ParentMapper.toDomainParent(record)
  }
}
