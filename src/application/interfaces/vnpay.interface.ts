/** Application port and Nest injection token for VnpayService. */
export abstract class VnpayService {}

export interface VnpayService {
  createPaymentUrl(...args: any[]): any
  verifyIpn(...args: any[]): any
  verifyReturnUrl(...args: any[]): any
}

