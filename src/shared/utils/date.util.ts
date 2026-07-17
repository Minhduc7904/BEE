import { ValidationException } from 'src/shared/exceptions/custom-exceptions'

export function parseOptionalDate(value: string | undefined, label: string): Date | undefined {
  if (value === undefined) return undefined

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new ValidationException(`${label} khong hop le`)
  }

  return date
}
