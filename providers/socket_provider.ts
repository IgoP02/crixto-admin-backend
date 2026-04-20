import { closeSocketServer, initSocketServer } from '#services/socket_service'
import type { ApplicationService } from '@adonisjs/core/types'

export default class SocketProvider {
  constructor(protected app: ApplicationService) {}

  async ready() {
    const httpServer = await this.app.container.make('server')

    if (this.app.getEnvironment() === 'web') {
      if (!httpServer) {
        throw new Error('[SocketProvider] HTTP server is not available in ready() hook')
      }
      initSocketServer(httpServer.getNodeServer()!)
    }
  }

  async shutdown() {
    closeSocketServer()
  }
}
