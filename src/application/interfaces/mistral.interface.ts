/** Application port and Nest injection token for MistralService. */
export abstract class MistralService {}

export interface MistralService {
  performOcr(...args: any[]): any
  getClient(...args: any[]): any
  getConfig(...args: any[]): any
}

