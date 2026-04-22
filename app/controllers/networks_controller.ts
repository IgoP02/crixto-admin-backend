import { emitConfigUpdate } from '#services/config_update_emitter'
import { upstreamApiService } from '#services/upstream_api_service'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { type UpstreamApi } from '../interfaces/upstream_api.ts'

export default class NetworksController {
  async index({ request, response }: HttpContext) {
    const data = await upstreamApiService.get('/networks', request.qs())
    return response.ok(data)
  }

  async toggleStatus({ request, response }: HttpContext) {
    const { id } = request.params()

    console.log({ id })
    try {
      const data = await upstreamApiService.post<UpstreamApi['networks']['toggleStatus']>(
        `/networks/${id}/toggle-status`
      )

      const action = data.enabled ? 'enable' : 'disable'

      emitConfigUpdate('network', action, { id, ...data })

      return response.ok(data)
    } catch (error) {
      console.error('Error toggling network status:', error)
      return response.internalServerError({ message: 'Failed to toggle network status' })
    }
  }

  async setGasWarningThreshold({ request, response }: HttpContext) {
    const { id } = request.params()
    const { threshold } = await request.validateUsing(
      vine.create({ threshold: vine.string().regex(/^\d+$/) })
    )
    try {
      const data = await upstreamApiService.put<UpstreamApi['networks']['setGasWarningThreshold']>(
        `/networks/${id}/set-gas-warning-threshold`,
        { gasWarningThreshold: threshold }
      )

      emitConfigUpdate('network', 'update', { ...data })

      return response.ok(data)
    } catch (error) {
      console.error('Error setting gas warning threshold:', error)
      return response.internalServerError({ message: 'Failed to set gas warning threshold' })
    }
  }
}
