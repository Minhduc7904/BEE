// src/infrastructure/interfaces/email.interface.ts
export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

export interface EmailVerificationData {
  email: string
  firstName: string
  verificationUrl: string
  appName: string
}

export interface WelcomeEmailData {
  email: string
  firstName: string
  role: 'admin' | 'student'
  appName: string
  loginUrl: string
}

export interface PasswordResetData {
  email: string
  firstName: string
  resetUrl: string
  appName: string
}

export interface IEmailService {
  sendVerificationEmail(data: EmailVerificationData): Promise<void>
  sendWelcomeEmail(data: WelcomeEmailData): Promise<void>
  sendPasswordResetEmail(data: PasswordResetData): Promise<void>
  sendRawEmail(template: EmailTemplate): Promise<void>
  sendTestEmail(to: string): Promise<void>
}
