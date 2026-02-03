import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'

export function IsEnumValue(enumObject: Record<string, any>, validationOptions?: ValidationOptions) {
  const enumValues = Object.values(enumObject).filter((v) => typeof v === 'string' || typeof v === 'number')

  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEnumValue',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return enumValues.includes(value)
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be one of: ${enumValues.join(', ')}`
        },
      },
    })
  }
}
