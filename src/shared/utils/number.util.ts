// src/shared/utils/number.util.ts

/**
 * Utility class for number operations and validations
 */
export class NumberUtil {
  /**
   * Ensures a value is a valid number, converting from string if needed
   * @param value - The value to convert/validate
   * @param fieldName - Name of the field for error messages
   * @returns The numeric value
   * @throws Error if value cannot be converted to a valid number
   */
  static ensureNumeric(value: any, fieldName: string = 'Value'): number {
    if (typeof value === 'number') {
      if (isNaN(value)) {
        throw new Error(`${fieldName} không thể là NaN`)
      }
      return value
    }

    if (typeof value === 'string') {
      const parsed = parseInt(value, 10)
      if (isNaN(parsed)) {
        throw new Error(`${fieldName} phải là số hợp lệ, nhận được: ${value}`)
      }
      return parsed
    }

    if (value === null || value === undefined) {
      throw new Error(`${fieldName} không thể là null hoặc undefined`)
    }

    throw new Error(`${fieldName} phải là số, nhận được: ${typeof value}`)
  }

  /**
   * Ensures a value is a positive integer
   * @param value - The value to validate
   * @param fieldName - Name of the field for error messages
   * @returns The positive integer
   * @throws Error if value is not a positive integer
   */
  static ensurePositiveInteger(value: any, fieldName: string = 'Value'): number {
    const numericValue = this.ensureNumeric(value, fieldName)

    if (numericValue <= 0) {
      throw new Error(`${fieldName} phải là số nguyên dương, nhận được: ${numericValue}`)
    }

    if (!Number.isInteger(numericValue)) {
      throw new Error(`${fieldName} phải là số nguyên, nhận được: ${numericValue}`)
    }

    return numericValue
  }

  /**
   * Ensures a value is a valid ID (positive integer)
   * @param value - The value to validate as ID
   * @param fieldName - Name of the field for error messages
   * @returns The valid ID
   * @throws Error if value is not a valid ID
   */
  static ensureValidId(value: any, fieldName: string = 'ID'): number {
    return this.ensurePositiveInteger(value, fieldName)
  }

  /**
   * Safely converts a value to number, returning default if invalid
   * @param value - The value to convert
   * @param defaultValue - Default value if conversion fails
   * @returns The numeric value or default
   */
  static safeToNumber(value: any, defaultValue: number = 0): number {
    try {
      return this.ensureNumeric(value)
    } catch {
      return defaultValue
    }
  }

  /**
   * Checks if a value is a valid number
   * @param value - The value to check
   * @returns True if value is a valid number
   */
  static isValidNumber(value: any): boolean {
    try {
      this.ensureNumeric(value)
      return true
    } catch {
      return false
    }
  }
}
