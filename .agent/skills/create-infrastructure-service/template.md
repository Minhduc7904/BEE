# Mẫu Infrastructure Service có config và application port

Thay `<Feature>`, `<feature>`, input/output và provider bằng thành phần thật. Giữ mọi environment variable trong config, không đặt chúng vào service.

## 1. Application port: `src/application/interfaces/<feature>.interface.ts`

```ts
/** Application port and Nest injection token for <Feature>Service. */
export abstract class <Feature>Service {}

export interface <Feature>Request {
  resourceId: number
}

export interface <Feature>Result {
  providerReference: string
}

export interface <Feature>Service {
  execute(input: <Feature>Request): Promise<<Feature>Result>
}
```

Export port từ `src/application/interfaces/index.ts` theo convention hiện có. Chỉ đưa type thuộc contract Application vào file này; không import SDK/provider concrete.

## 2. Config: `src/config/<feature>.config.ts`

```ts
import { registerAs } from '@nestjs/config'

const optional = (value?: string): string | undefined => value?.trim() || undefined

export const <Feature>Config = registerAs('<feature>', () => ({
  apiUrl: (optional(process.env.<FEATURE>_API_URL) || 'https://api.example.com').replace(/\/$/, ''),
  apiKey: optional(process.env.<FEATURE>_API_KEY),
  timeoutMs: Number.parseInt(process.env.<FEATURE>_TIMEOUT_MS || '15000', 10),
}))

export default <Feature>Config
```

Đây là **nơi duy nhất** giữ `<FEATURE>_API_URL`, `<FEATURE>_API_KEY` và các env name. Chỉ dùng fallback không nhạy cảm; không đặt API key, token hoặc URL private làm default.

## 3. Concrete service: `src/infrastructure/services/<feature>.service.ts`

```ts
import { BadGatewayException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import type {
  <Feature>Request,
  <Feature>Result,
  <Feature>Service as <Feature>ServicePort,
} from 'src/application/interfaces/<feature>.interface'
import { <Feature>Config } from 'src/config/<feature>.config'

@Injectable()
export class <Feature>Service implements <Feature>ServicePort {
  constructor(
    @Inject(<Feature>Config.KEY)
    private readonly config: ConfigType<typeof <Feature>Config>,
  ) {}

  async execute(input: <Feature>Request): Promise<<Feature>Result> {
    const apiKey = this.requireConfig(this.config.apiKey)

    try {
      // Gọi SDK/HTTP provider bằng this.config.apiUrl, apiKey và input typed.
      return { providerReference: '...' }
    } catch (error) {
      // Chỉ log/redact context an toàn; không trả raw error từ provider.
      throw new BadGatewayException('Không thể gọi dịch vụ <Feature>')
    }
  }

  private requireConfig(value: string | undefined): string {
    if (!value?.trim()) {
      throw new InternalServerErrorException('Thiếu cấu hình dịch vụ <Feature>')
    }
    return value.trim()
  }
}
```

Tên biến environment chỉ xuất hiện trong config; service không đọc `process.env` và cũng không hard-code tên env.

## 4. Đăng ký module

```ts
import { ConfigModule } from '@nestjs/config'
import { <Feature>Config } from 'src/config/<feature>.config'
import {
  <Feature>Service as <Feature>ServicePort,
} from 'src/application/interfaces/<feature>.interface'
import { <Feature>Service } from './services/<feature>.service'

@Module({
  imports: [ConfigModule.forFeature(<Feature>Config)],
  providers: [
    <Feature>Service,
    { provide: <Feature>ServicePort, useExisting: <Feature>Service },
  ],
  exports: [<Feature>ServicePort],
})
export class InfrastructureModule {}
```

Nếu `InfrastructureModule` đã có provider/import, chỉ thêm phần cần thiết, không tạo module thứ hai. Consumer Application inject `<Feature>ServicePort`, không import `<Feature>Service` concrete.
