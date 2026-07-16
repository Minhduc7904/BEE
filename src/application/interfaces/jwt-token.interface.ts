/** Application port and Nest injection token for JwtTokenService. */
export abstract class JwtTokenService {}

export interface JwtTokenService {
  generateAccessToken(...args: any[]): any
  generateRefreshToken(...args: any[]): any
  verifyAccessToken(...args: any[]): any
  verifyRefreshToken(...args: any[]): any
  decodeToken(...args: any[]): any
  getAccessTokenExpirationTime(...args: any[]): any
}

