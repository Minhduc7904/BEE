// src/shared/pipes/normalize-array-query.pipe.ts
import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class NormalizeArrayQueryPipe implements PipeTransform {
    transform(value: any) {
        // ✅ GUARD CLAUSE – cực kỳ quan trọng
        if (!value || typeof value !== 'object') {
            return value;
        }

        Object.keys(value).forEach((key) => {
            if (key.endsWith('[]')) {
                const normalizedKey = key.replace(/\[\]$/, '');

                const rawValue = value[key];

                value[normalizedKey] = Array.isArray(rawValue)
                    ? rawValue
                    : [rawValue];

                delete value[key];
            }
        });

        return value;
    }
}
