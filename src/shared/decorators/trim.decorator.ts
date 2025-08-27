import { Transform } from 'class-transformer';
import { TransformFnParams } from 'class-transformer';

export function Trim() {
    return Transform(({ value }: TransformFnParams) =>
        typeof value === 'string' ? value.trim() : value,
    );
}
