import { IoAdapter } from '@nestjs/platform-socket.io'
import { Socket } from 'socket.io'

/**
 * Nest registers a disconnect callback for every gateway sharing a namespace.
 * Keep one EventEmitter listener per client and fan out to all gateway
 * callbacks when that client disconnects.
 */
export class DeduplicatedDisconnectIoAdapter extends IoAdapter {
  private readonly disconnectCallbacks = new WeakMap<Socket, Set<() => void>>()

  bindClientDisconnect(client: Socket, callback: () => void): void {
    const registeredCallbacks = this.disconnectCallbacks.get(client)
    if (registeredCallbacks) {
      registeredCallbacks.add(callback)
      return
    }

    const callbacks = new Set<() => void>([callback])
    this.disconnectCallbacks.set(client, callbacks)

    client.once('disconnect', () => {
      this.disconnectCallbacks.delete(client)

      for (const disconnectCallback of callbacks) {
        disconnectCallback()
      }
    })
  }
}
