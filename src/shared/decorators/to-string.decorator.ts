import { Transform } from "class-transformer";

export function EmptyToUndefined(): PropertyDecorator {
    return Transform(({ value }) => (value === '' ? undefined : value))
}