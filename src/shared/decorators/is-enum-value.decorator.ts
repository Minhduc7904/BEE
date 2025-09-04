// src/shared/decorators/is-enum-value.decorator.ts
import { 
  registerDecorator, 
  ValidationOptions, 
  ValidationArguments,
} from 'class-validator';

/**
 * Custom decorator để validate enum values
 * @param enumObject - Enum object để validate
 * @param validationOptions - Class validator options
 */
export function IsEnumValue(
  enumObject: Record<string, any>,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEnumValue',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const enumValues = Object.values(enumObject);
          return enumValues.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          const enumValues = Object.values(enumObject);
          return `${args.property} must be one of: ${enumValues.join(', ')}`;
        },
      },
    });
  };
}
