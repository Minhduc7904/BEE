import { Transform } from 'class-transformer';

/**
 * Decorator chuyển đổi string thành number
 * Sử dụng cho query parameters từ URL
 * - Chuỗi rỗng, null, undefined -> undefined
 * - Chuỗi số hợp lệ -> number
 * - Khác -> undefined
 * Ví dụ:
 * "123" -> 123
 * "abc" -> undefined
 * "" -> undefined
 * null -> undefined
 * undefined -> undefined
 * 123 -> 123
 * true -> undefined
 * false -> undefined
 * {} -> undefined
 * [] -> undefined
 * "123abc" -> undefined
 * "  456  " -> 456
 */
export function ToNumber() {
    return Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsedValue = Number(value);
        return isNaN(parsedValue) ? undefined : parsedValue;
    });
}

export function ToNumberArray() {
    return Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        if (Array.isArray(value)) {
            const numberArray = value
                .map((item) => {
                    const parsedValue = Number(item);
                    return isNaN(parsedValue) ? undefined : parsedValue;
                })
                .filter((item) => item !== undefined) as number[];
            return numberArray.length > 0 ? numberArray : undefined;
        }
        const parsedValue = Number(value);
        return isNaN(parsedValue) ? undefined : [parsedValue];
    });
}