import { upstreamApiService } from '#services/upstream_api_service'
import type { HttpContext } from '@adonisjs/core/http'
import { type UpstreamApi } from '../interfaces/upstream_api.ts'

export default class LiquiditiesController {
  async getCurrent({ response }: HttpContext) {
    const res = await upstreamApiService.get<UpstreamApi['liquidity']['snapshot']>(
      '/transactions/liquidity/snapshot',
      {}
    )
    return response.ok(res)
  }
}
