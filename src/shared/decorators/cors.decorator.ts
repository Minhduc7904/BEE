import { SetMetadata } from '@nestjs/common'

export const CORS_METADATA_KEY = 'cors'

/**
 * Custom CORS configuration decorator for specific routes
 * @param origins - Array of allowed origins for this specific route
 * @example
 * @CustomCors(['https://specific-domain.com'])
 * @Get('specific-endpoint')
 * async specificEndpoint() { ... }
 */
export const CustomCors = (origins: string[]) => SetMetadata(CORS_METADATA_KEY, origins)
