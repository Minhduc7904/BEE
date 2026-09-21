import type { AuthenticatedUser, ParentStudentResultsReadService } from '../../interfaces'
import { ParentStudentResultListQueryDto } from '../../dtos/parent-student-results'
import {
  GetParentStudentCompetitionSubmissionDetailUseCase,
  GetParentStudentCompetitionSubmissionsUseCase,
  GetParentStudentCompetitionStatisticsUseCase,
  GetParentStudentHomeworkSubmissionDetailUseCase,
  GetParentStudentHomeworkSubmissionsUseCase,
  GetParentStudentHomeworkStatisticsUseCase,
} from '.'

const parentIdentity: AuthenticatedUser = {
  userId: 10,
  username: 'parent-test',
  userType: 'parent',
  parentId: 20,
  roles: [],
  permissions: [],
}

describe('Parent student results ownership', () => {
  it.each([
    [
      'homework list',
      (service: ParentStudentResultsReadService) =>
        new GetParentStudentHomeworkSubmissionsUseCase(service).execute(
          parentIdentity,
          99,
          new ParentStudentResultListQueryDto(),
        ),
    ],
    [
      'homework statistics',
      (service: ParentStudentResultsReadService) =>
        new GetParentStudentHomeworkStatisticsUseCase(service).execute(parentIdentity, 99),
    ],
    [
      'homework detail',
      (service: ParentStudentResultsReadService) =>
        new GetParentStudentHomeworkSubmissionDetailUseCase(service).execute(parentIdentity, 99, 1),
    ],
    [
      'competition list',
      (service: ParentStudentResultsReadService) =>
        new GetParentStudentCompetitionSubmissionsUseCase(service).execute(
          parentIdentity,
          99,
          new ParentStudentResultListQueryDto(),
        ),
    ],
    [
      'competition statistics',
      (service: ParentStudentResultsReadService) =>
        new GetParentStudentCompetitionStatisticsUseCase(service).execute(parentIdentity, 99),
    ],
    [
      'competition detail',
      (service: ParentStudentResultsReadService) =>
        new GetParentStudentCompetitionSubmissionDetailUseCase(service).execute(parentIdentity, 99, 1),
    ],
  ])('rejects %s before reading submission data when the student is not linked', async (_, execute) => {
    const service = {
      isStudentLinked: jest.fn().mockResolvedValue(false),
      listHomeworkSubmissions: jest.fn(),
      getHomeworkSubmissionStatistics: jest.fn(),
      getHomeworkSubmissionDetail: jest.fn(),
      listStandaloneCompetitionSubmissions: jest.fn(),
      getStandaloneCompetitionSubmissionStatistics: jest.fn(),
      getStandaloneCompetitionSubmissionDetail: jest.fn(),
    } as unknown as ParentStudentResultsReadService

    await expect(execute(service)).rejects.toHaveProperty('name', 'ForbiddenException')
    expect(service.isStudentLinked).toHaveBeenCalledWith(20, 99)
    expect(service.listHomeworkSubmissions).not.toHaveBeenCalled()
    expect(service.getHomeworkSubmissionStatistics).not.toHaveBeenCalled()
    expect(service.getHomeworkSubmissionDetail).not.toHaveBeenCalled()
    expect(service.listStandaloneCompetitionSubmissions).not.toHaveBeenCalled()
    expect(service.getStandaloneCompetitionSubmissionStatistics).not.toHaveBeenCalled()
    expect(service.getStandaloneCompetitionSubmissionDetail).not.toHaveBeenCalled()
  })
})
