import { TuitionCollectionConfiguration } from '../entities/tuition-online-payment'
import {
  CreateTuitionCollectionConfigurationData,
  UpdateTuitionCollectionConfigurationData,
} from '../interface/tuition-online-payment'

export interface ITuitionCollectionConfigurationRepository {
  create(data: CreateTuitionCollectionConfigurationData): Promise<TuitionCollectionConfiguration>
  findById(tuitionCollectionConfigurationId: number): Promise<TuitionCollectionConfiguration | null>
  findCurrent(): Promise<TuitionCollectionConfiguration | null>
  update(
    tuitionCollectionConfigurationId: number,
    data: UpdateTuitionCollectionConfigurationData,
  ): Promise<TuitionCollectionConfiguration>
}
