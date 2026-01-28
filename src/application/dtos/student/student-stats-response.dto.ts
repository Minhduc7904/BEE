// 
export class StudentStatsResponseDto {
    total: number
    active: number
    inactive: number

    constructor(data: { active: number; inactive: number }) {
        this.total = data.active + data.inactive
        this.active = data.active
        this.inactive = data.inactive
    }
}

export class StudentGradeStatsResponseDto {
    grade: number
    total: number
    active: number
    inactive: number

    constructor(data: { grade: number; active: number; inactive: number }) {
        this.grade = data.grade
        this.active = data.active
        this.inactive = data.inactive
        this.total = data.active + data.inactive
    }
}

export class StudentGradeStatsListResponseDto {
    total: number
    items: StudentGradeStatsResponseDto[]

    constructor(data: { grade: number; active: number; inactive: number }[]) {
        this.items = data.map(
            (item) => new StudentGradeStatsResponseDto(item),
        )
        this.total = this.items.reduce((sum, i) => sum + i.total, 0)
    }
}