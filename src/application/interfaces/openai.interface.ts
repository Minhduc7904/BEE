/** Application port and Nest injection token for OpenAIService. */
export abstract class OpenAIService {}

export interface OpenAIService {
  createChatCompletion(...args: any[]): any
  createStreamingChatCompletion(...args: any[]): any
  generateText(...args: any[]): any
  getClient(...args: any[]): any
  getConfig(...args: any[]): any
}

