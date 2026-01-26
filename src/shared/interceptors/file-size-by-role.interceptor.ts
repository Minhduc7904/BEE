// src/shared/interceptors/file-size-by-role.interceptor.ts
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    BadRequestException,
} from '@nestjs/common'
import { Observable } from 'rxjs'

@Injectable()
export class FileSizeByRoleInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest()
        const file: Express.Multer.File = request.file
        const user = request.user

        if (!file) {
            throw new BadRequestException('File is required')
        }

        const role = user?.userType // ví dụ: 'student' | 'admin'
        const fileSize = file.size

        const MAX_SIZE_BY_ROLE = {
            student: 5 * 1024 * 1024,  // 5MB
            admin: 50 * 1024 * 1024,  // 50MB
        }

        const maxSize = MAX_SIZE_BY_ROLE[role] ?? MAX_SIZE_BY_ROLE.student
        if (fileSize > maxSize) {
            throw new BadRequestException(
                `File too large. Max size for ${role} is ${Math.round(maxSize / 1024 / 1024)}MB`,
            )
        }

        return next.handle()
    }
}
