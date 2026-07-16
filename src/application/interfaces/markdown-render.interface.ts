/** Application port and Nest injection token for MarkdownRenderService. */
export abstract class MarkdownRenderService {}

export interface MarkdownRenderService {
  renderToHtml(...args: any[]): any
}

