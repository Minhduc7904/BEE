/** Application port and Nest injection token for PasswordService. */
export abstract class PasswordService {}

export interface PasswordService {
  hashPassword(...args: any[]): any
  comparePassword(...args: any[]): any
}

