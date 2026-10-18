import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

import { TuitionPaymentListQueryDto } from './tuition-payment-list-query.dto'

function parse(query: Record<string, unknown>) {
  return plainToInstance(TuitionPaymentListQueryDto, query)
}

describe('TuitionPaymentListQueryDto payer-reported filter', () => {
  it.each([
    ['true', true],
    ['false', false],
  ])('parses payerReportedTransferred=%s into a boolean filter', async (raw, expected) => {
    const dto = parse({ payerReportedTransferred: raw })

    await expect(validate(dto)).resolves.toHaveLength(0)
    expect(dto.toTuitionPaymentFilterOptions().payerReportedTransferred).toBe(expected)
  })

  it('leaves the filter undefined when omitted, meaning "all"', () => {
    expect(parse({}).toTuitionPaymentFilterOptions().payerReportedTransferred).toBeUndefined()
  })

  it('sorts by the newest report first when filtering "reported" without an explicit sort', () => {
    const options = parse({ payerReportedTransferred: 'true' }).toTuitionPaymentPaginationOptions()

    expect(options.sortBy).toBe('payerReportedTransferredAt')
  })

  it('keeps the default sort for "not reported" and for no filter', () => {
    expect(parse({ payerReportedTransferred: 'false' }).toTuitionPaymentPaginationOptions().sortBy).toBe('createdAt')
    expect(parse({}).toTuitionPaymentPaginationOptions().sortBy).toBe('createdAt')
  })

  it('allows sorting directly by the report time and still honours an explicit sort', () => {
    expect(parse({ sortBy: 'payerReportedTransferredAt' }).toTuitionPaymentPaginationOptions().sortBy).toBe(
      'payerReportedTransferredAt',
    )
    expect(
      parse({ payerReportedTransferred: 'true', sortBy: 'paidAt' }).toTuitionPaymentPaginationOptions().sortBy,
    ).toBe('paidAt')
  })

  it('falls back to the default for a sort field that is not whitelisted', () => {
    expect(parse({ sortBy: 'amount; DROP TABLE tuition_payments' }).toTuitionPaymentPaginationOptions().sortBy).toBe(
      'createdAt',
    )
  })
})
