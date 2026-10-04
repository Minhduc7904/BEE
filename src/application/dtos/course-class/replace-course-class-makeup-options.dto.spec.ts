import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { ReplaceCourseClassMakeupOptionsDto } from './replace-course-class-makeup-options.dto'

async function errorsFor(body: unknown) {
  const dto = plainToInstance(ReplaceCourseClassMakeupOptionsDto, body)
  return validate(dto)
}

describe('ReplaceCourseClassMakeupOptionsDto', () => {
  it('chấp nhận danh sách ID dương', async () => {
    expect(await errorsFor({ makeupClassIds: [152, 153, 154] })).toHaveLength(0)
  })

  it('chấp nhận mảng rỗng để xóa toàn bộ cấu hình', async () => {
    expect(await errorsFor({ makeupClassIds: [] })).toHaveLength(0)
  })

  it('từ chối thiếu field hoặc null', async () => {
    expect(await errorsFor({})).not.toHaveLength(0)
    expect(await errorsFor({ makeupClassIds: null })).not.toHaveLength(0)
  })

  it('từ chối không phải mảng', async () => {
    expect(await errorsFor({ makeupClassIds: 152 })).not.toHaveLength(0)
  })

  it('từ chối phần tử không phải số nguyên dương', async () => {
    expect(await errorsFor({ makeupClassIds: [0] })).not.toHaveLength(0)
    expect(await errorsFor({ makeupClassIds: [-3] })).not.toHaveLength(0)
    expect(await errorsFor({ makeupClassIds: [1.5] })).not.toHaveLength(0)
    expect(await errorsFor({ makeupClassIds: ['abc'] })).not.toHaveLength(0)
  })
})
