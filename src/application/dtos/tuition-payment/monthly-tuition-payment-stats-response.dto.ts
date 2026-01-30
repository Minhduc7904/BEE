
export class MonthlyStatsItem {
    month: number

    paidAmount: number

    unpaidAmount: number

    totalAmount: number

    paidCount: number

    unpaidCount: number

    totalCount: number
}

export class MonthlyTuitionPaymentStatsResponseDto {
    year: number

    months: MonthlyStatsItem[]

    totalPaidAmount: number

    totalUnpaidAmount: number

    totalAmount: number

    totalPaidCount: number

    totalUnpaidCount: number

    totalCount: number

    constructor(data: {
        year: number
        months: MonthlyStatsItem[]
        totalPaidAmount: number
        totalUnpaidAmount: number
        totalAmount: number
        totalPaidCount: number
        totalUnpaidCount: number
        totalCount: number
    }) {
        this.year = data.year
        this.months = data.months
        this.totalPaidAmount = data.totalPaidAmount
        this.totalUnpaidAmount = data.totalUnpaidAmount
        this.totalAmount = data.totalAmount
        this.totalPaidCount = data.totalPaidCount
        this.totalUnpaidCount = data.totalUnpaidCount
        this.totalCount = data.totalCount
    }

}
