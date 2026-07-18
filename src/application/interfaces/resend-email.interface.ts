/** Application port and Nest injection token for ResendEmailService. */
export abstract class ResendEmailService {}

export interface ResendEmailService {
  sendVerificationEmail(...args: any[]): any
  sendWelcomeEmail(...args: any[]): any
  sendPasswordResetEmail(...args: any[]): any
  sendRawEmail(...args: any[]): any
  sendTestEmail(...args: any[]): any
}

