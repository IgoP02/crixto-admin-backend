import { emitConfigUpdate } from '#services/config_update_emitter'
import { upstreamApiService } from '#services/upstream_api_service'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { type UpstreamApi } from '../interfaces/upstream_api.ts'

export default class CurrenciesController {
  async index({ request, response }: HttpContext) {
    const data = await upstreamApiService.get('/crypto-assets', request.qs())
    return response.ok(data)
  }

  async store({ request, response }: HttpContext) {
    const payload: UpstreamApi['currencies']['store']['payload'] = await request.validateUsing(
      vine.create({
        symbol: vine.string(),
        name: vine.string(),
        baseUnitFactor: vine.string(),
        platformFee: vine.string(),
        coinType: vine.number(),
        networks: vine.array(
          vine.object({
            id: vine.number(),
            enabled: vine.boolean().optional(),
            sweepThresholdAmount: vine.string(),
            multisigMinAmount: vine.string().optional(),
            refillThresholdAmount: vine.string(),
            baseUnitFactor: vine.string().optional(),
            tokenAddress: vine.string().optional(),
          })
        ),
      })
    )
    const data = await upstreamApiService.post('/crypto-assets/token', payload)

    console.log(data)

    emitConfigUpdate('crypto-asset', 'store', data)
    return response.created(data)
  }

  async update({ request, response }: HttpContext) {
    console.log('before validation ')

    const payload: UpstreamApi['currencies']['update']['payload'] = await request.validateUsing(
      vine.create({
        symbol: vine.string(),
        name: vine.string(),
        networks: vine
          .array(
            vine.object({
              id: vine.number(),
              enabled: vine.boolean().optional(),
              sweepThresholdAmount: vine.string(),
              multisigMinAmount: vine.string().optional(),
              refillThresholdAmount: vine.string(),
              baseUnitFactor: vine.string().optional(),
              tokenAddress: vine.string().optional(),
            })
          )
          .minLength(1),
      })
    )

    const { id } = request.params()
    console.log({ id, ...payload })
    const data = await upstreamApiService.put<UpstreamApi['currencies']['update']>(
      `/crypto-assets/${id}`,
      payload
    )

    console.log('Response data', data)

    emitConfigUpdate('crypto-asset', 'update', { id, ...data })

    return response.ok(data)
  }
}
