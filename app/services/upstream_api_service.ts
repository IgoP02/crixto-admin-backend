import env from '#start/env'
import ky from 'ky'
import type { UpstreamApi } from '../interfaces/upstream_api.js'

const client = ky.create({
  prefix: env.get('UPSTREAM_API_URL'),
  headers: {
    'X-Api-Key': env.get('UPSTREAM_API_KEY'),
  },
})

export const upstreamApiService = {
  async get<
    T extends { route: string; queryParams?: Record<string, string | number>; response?: unknown },
  >(route: T['route'], queryParams?: T['queryParams']): Promise<T['response']> {
    try {
      const path = route.startsWith('/') ? route.slice(1) : route
      const searchParams: Record<string, string> = {}
      if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
          if (value !== undefined) searchParams[key] = String(value)
        }
      }
      const res = await client.get(path, { searchParams })

      return res.body ? await res.json() : null
    } catch (error) {
      console.log('Caught error ', error)
      throw error
    }
  },

  async post<T extends { route: string; payload?: unknown; response?: unknown }>(
    route: T['route'],
    payload?: T['payload']
  ): Promise<T['response']> {
    try {
      const path = route.startsWith('/') ? route.slice(1) : route
      const res = await client.post(path, { json: payload ? payload : undefined })
      console.log(res)

      const jsonRes = res.body ? await res.json() : null
      return jsonRes
    } catch (error) {
      console.log('Caught error ', error)
      throw error
    }
  },

  async put<T extends { route: string; payload?: unknown; response?: unknown }>(
    route: T['route'],
    payload?: T['payload']
  ): Promise<T['response']> {
    try {
      const path = route.startsWith('/') ? route.slice(1) : route
      const res = await client.put(path, { json: payload ? payload : undefined })

      return res.body ? await res.json() : null
    } catch (error) {
      console.log('Caught error ', error)
      throw error
    }
  },
}

export type CurrenciesApi = UpstreamApi['currencies']
export type NetworksApi = UpstreamApi['networks']
