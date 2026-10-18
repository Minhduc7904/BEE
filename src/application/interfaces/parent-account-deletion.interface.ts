export abstract class ParentAccountDeletionPhoneHasher {
  abstract hashNormalizedPhone(phone: string): string
}

export abstract class ParentAccountRealtimeRevocationService {
  abstract revoke(userId: number): Promise<void>
}
