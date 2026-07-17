/** Application port and Nest injection token for TokenService. */
export abstract class TokenService {}

export interface TokenService {
  generateToken(...args: any[]): any
  hashToken(...args: any[]): any
  verifyToken(...args: any[]): any
  generateExpiryTime(...args: any[]): any
}

