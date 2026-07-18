/** Application port and Nest injection token for HttpClientService. */
export abstract class HttpClientService {}

export interface HttpClientService {
  updateBearerToken(...args: any[]): any
  removeBearerToken(...args: any[]): any
  getCurrentBearerToken(...args: any[]): any
  get(...args: any[]): any
  post(...args: any[]): any
  put(...args: any[]): any
  patch(...args: any[]): any
  delete(...args: any[]): any
  downloadFile(...args: any[]): any
  requestWithRetry(...args: any[]): any
  ping(...args: any[]): any
  fetchMultiple(...args: any[]): any
  createCustomInstance(...args: any[]): any
}

