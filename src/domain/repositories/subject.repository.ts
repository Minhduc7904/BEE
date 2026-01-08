import { Subject } from '../entities/subject/subject.entity'

export interface CreateSubjectData {
  name: string
  code?: string
}

export interface UpdateSubjectData {
  name?: string
  code?: string
}

export interface FindAllSubjectsOptions {
  skip?: number
  take?: number
  search?: string
  code?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FindAllSubjectsResult {
  data: Subject[]
  total: number
}

export interface ISubjectRepository {
  create(data: CreateSubjectData): Promise<Subject>
  findById(id: number): Promise<Subject | null>
  findByCode(code: string): Promise<Subject | null>
  findByName(name: string): Promise<Subject | null>
  findAll(limit?: number, offset?: number): Promise<Subject[]>
  findAllWithPagination(options: FindAllSubjectsOptions): Promise<FindAllSubjectsResult>
  update(id: number, data: UpdateSubjectData): Promise<Subject>
  delete(id: number): Promise<void>
}
