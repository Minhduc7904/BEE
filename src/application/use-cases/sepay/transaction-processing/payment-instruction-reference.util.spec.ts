import { BankTransferTransactionType } from 'src/shared/enums'
import { extractPaymentInstructionReference } from './payment-instruction-reference.util'

describe('extractPaymentInstructionReference', () => {
  it('parses current and legacy tuition references', () => {
    expect(extractPaymentInstructionReference('HPABCDE TP123 HS NGUYEN VAN A')).toEqual({
      attemptCode: 'HPABCDE',
      type: BankTransferTransactionType.TUITION_PAYMENT,
      tuitionPaymentId: 123,
    })
    expect(extractPaymentInstructionReference('hpabcde | TP:123 | HS NGUYEN VAN A')).toEqual({
      attemptCode: 'HPABCDE',
      type: BankTransferTransactionType.TUITION_PAYMENT,
      tuitionPaymentId: 123,
    })
  })

  it('parses course references and rejects malformed enrollment IDs', () => {
    expect(extractPaymentInstructionReference('KHABCDE CE456 HS NGUYEN VAN A 0900000000')).toEqual({
      attemptCode: 'KHABCDE',
      type: BankTransferTransactionType.COURSE_PURCHASE,
      courseEnrollmentId: 456,
    })
    expect(extractPaymentInstructionReference('KHABCDE CE0 HS NGUYEN VAN A')).toBeNull()
    expect(extractPaymentInstructionReference('KHABCDE TP456')).toBeNull()
  })
})
