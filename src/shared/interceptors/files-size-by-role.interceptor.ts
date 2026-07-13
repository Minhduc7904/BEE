import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'

/** Validates a multipart `files` field after FilesInterceptor has parsed it. */
@Injectable()
export class FilesSizeByRoleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const files: Express.Multer.File[] = request.files ?? []

    if (!files.length) {
      throw new BadRequestException('At least one file is required')
    }

    const role = request.user?.userType
    const maxSize = role === 'admin' ? 50 * 1024 * 1024 : 5 * 1024 * 1024

    if (files.some((file) => file.size > maxSize)) {
      throw new BadRequestException(
        `Each file must not exceed ${Math.round(maxSize / 1024 / 1024)}MB`,
      )
    }

    return next.handle()
  }
}
