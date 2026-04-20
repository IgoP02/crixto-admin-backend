import { emitConfigUpdate } from '#services/config_update_emitter'
import { upstreamApiService } from '#services/upstream_api_service'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { type UpstreamApi } from '../interfaces/upstream_api.ts'

const storeValidator = vine.create(
  vine.object({
    host: vine.string().trim(),
    description: vine.string().trim(),
    type: vine.string().trim(),
  })
)

export default class SignersController {
  async index({ request, response }: HttpContext) {
    const data = await upstreamApiService.get('/signers', request.qs())
    return response.ok(data)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeValidator)
    const data = await upstreamApiService.post('/signers', payload)
    emitConfigUpdate('signer', 'store', data)
    return response.created(data)
  }

  async disable({ request, response }: HttpContext) {
    const { id } = request.params()
    const data = await upstreamApiService.post<UpstreamApi['signers']['disable']>(
      `/signers/${id}/disable`
    )
    emitConfigUpdate('signer', 'disable', { id, enabled: false })
    return response.ok(data)
  }
}
