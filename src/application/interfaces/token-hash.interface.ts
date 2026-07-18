/** Application port and Nest injection token for TokenHashService. */
export abstract class TokenHashService {}

export interface TokenHashService {
  hashToken(...args: any[]): any
  verifyToken(...args: any[]): any
}

