// src/domain/entities/log/admin-audit-log.entity.ts

import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { Admin } from '../user/admin.entity'

export class AdminAuditLog {
  // Required properties
  logId: number
  adminId: number
  actionKey: string
  status: AuditStatus
  resourceType: string
  createdAt: Date

  // Optional properties
  errorMessage?: string
  resourceId?: string
  beforeData?: any
  afterData?: any

  // Navigation properties
  admin?: Admin

  constructor(data: {
    logId: number
    adminId: number
    actionKey: string
    status: AuditStatus
    resourceType: string
    createdAt?: Date
    errorMessage?: string
    resourceId?: string
    beforeData?: any
    afterData?: any
    admin?: Admin
  }) {
    this.logId = data.logId
    this.adminId = data.adminId
    this.actionKey = data.actionKey
    this.status = data.status
    this.resourceType = data.resourceType
    this.createdAt = data.createdAt || new Date()

    this.errorMessage = data.errorMessage
    this.resourceId = data.resourceId
    this.beforeData = data.beforeData
    this.afterData = data.afterData
    this.admin = data.admin
  }

  /* ===================== DOMAIN METHODS ===================== */

  isSuccess(): boolean {
    return this.status === AuditStatus.SUCCESS
  }

  isFailed(): boolean {
    return this.status === AuditStatus.FAIL
  }

  hasError(): boolean {
    return Boolean(this.errorMessage)
  }

  equals(other: AdminAuditLog): boolean {
    return this.logId === other.logId
  }

  toJSON() {
    return {
      logId: this.logId,
      adminId: this.adminId,
      actionKey: this.actionKey,
      status: this.status,
      errorMessage: this.errorMessage,
      resourceType: this.resourceType,
      resourceId: this.resourceId,
      beforeData: this.beforeData,
      afterData: this.afterData,
      createdAt: this.createdAt,
    }
  }

  clone(): AdminAuditLog {
    return new AdminAuditLog({
      logId: this.logId,
      adminId: this.adminId,
      actionKey: this.actionKey,
      status: this.status,
      resourceType: this.resourceType,
      createdAt: this.createdAt,
      errorMessage: this.errorMessage,
      resourceId: this.resourceId,
      beforeData: this.beforeData,
      afterData: this.afterData,
      admin: this.admin,
    })
  }
}
