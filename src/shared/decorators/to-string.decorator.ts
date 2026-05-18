import { Transform } from "class-transformer";

export function EmptyToUndefined(): PropertyDecorator {
    return Transform(({ value }) => (value === '' ? undefined : value))
}

export function ToStringArray(): PropertyDecorator {
    return Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined
        }

        if (Array.isArray(value)) {
            const stringArray = value
                .map((item) => (typeof item === 'string' ? item.trim() : undefined))
                .filter((item): item is string => Boolean(item))

            return stringArray.length > 0 ? stringArray : undefined
        }

        if (typeof value !== 'string') {
            return undefined
        }

        const normalizedValue = value.trim()
        return normalizedValue ? [normalizedValue] : undefined
    })
}
