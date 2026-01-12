export class AttendanceStatisticsDto {
    total: number
    present: number
    absent: number
    late: number
    makeup: number

    constructor(data: {
        total: number
        present: number
        absent: number
        late: number
        makeup: number
    }) {
        this.total = data.total
        this.present = data.present
        this.absent = data.absent
        this.late = data.late
        this.makeup = data.makeup
    }
}
