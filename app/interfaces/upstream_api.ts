interface EndpointShape<T, Y> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  route: string
  queryParams?: Record<string, string | number>
  params?: Record<string, string | number>
  payload?: T
  response?: Y
}

export interface UpstreamApi extends Record<string, Record<string, EndpointShape<any, any>>> {
  currencies: {
    index: {
      method: 'GET'
      route: '/crypto-assets'
      queryParams: { perPage?: number; page: number }
      response: CryptoAssetIndexResponse | PaginatedResponse<CryptoAssetResponse>
    }
    store: {
      method: 'POST'
      route: '/crypto-assets'
      payload: {
        symbol: string
        name: string
        baseUnitFactor: string
        platformFee: string
        networks: {
          id: number
          enabled?: boolean
          sweepThresholdAmount: string
          multisigMinAmount?: string
          // tokenAddress: string
          refillThresholdAmount: string
          baseUnitFactor?: string
        }[]
      }
      response: CryptoAsset | ValidationErrorResponse
    }
    update: {
      method: 'PUT'
      route: `/crypto-assets/${number}`
      payload: {
        symbol: string
        name: string
        networks: {
          id: number
          enabled?: boolean
          sweepThresholdAmount: string
          multisigMinAmount?: string
          // tokenAddress: string
          refillThresholdAmount: string
          baseUnitFactor?: string
        }[]
      }
      response: CryptoAsset | ValidationErrorResponse
    }
  }
  networks: {
    index: {
      method: 'GET'
      route: '/networks'
      queryParams: { perPage?: number; page: number }
      response: NetworkResponse | PaginatedResponse<Network>
    }
    toggleStatus: {
      method: 'POST'
      route: `/networks/${number}/toggle-status`
      params: { id: number }
      response: { enabled: boolean }
    }
    /*     store: {
      method: 'POST'
      route: '/networks'
      payload: {
        symbol: string
        type: string
        name: string
        baseUnitFactor: string
        platformFee: string
        networks: {
          name: string
          enabled: boolean
          standard: string
          allowsTokens: boolean
          smartContractId: number
        }
      }
      response: NetworkResponse | PaginatedResponse<Network>
    } */
  }
  signers: {
    index: {
      method: 'GET'
      route: '/signers'
      queryParams: { perPage?: number; page: number }
      response: SignerResponse | PaginatedResponse<Signer>
    }
    store: {
      method: 'POST'
      route: '/signers'
      payload: {
        host: string
        description: string
        type: string
      }
      response: Signer
    }
    disable: {
      method: 'POST'
      route: `/signers/${number}/disable`
      params: { id: number }
      response: null
    }
  }
}

export type CryptoAssetIndexResponse = CryptoAssetResponse[]

export type CryptoAssetResponse = {
  id: number
  symbol: string
  type: string
  name: string
  coinType: number
  baseUnitFactor: string
  platformFee: string
  createdAt: string
  updatedAt: string
  networks: CryptoAssetNetwork[]
}

export type CryptoAssetNetwork = {
  id: number
  name: string
  enabled: boolean
  standard: string
  allowsTokens: boolean
  assetEnabled: boolean
  tokenAddress: string
  sweepThresholdAmount: string
  multisigMinAmount?: string
  refillThresholdAmount: string
}

export type NetworkResponse = Network[]

export interface Network {
  id: number
  name: string
  enabled: boolean
  standard: string
  allowsTokens: boolean
  smartContractId: number
  createdAt: string
  updatedAt: string
  cryptoAssets: CryptoAsset[]
}

export interface CryptoAsset {
  id: number
  name: string
  symbol: string
  asset_enabled: boolean
  token_address?: string
  sweep_threshold_amount: string
  refill_threshold_amount: string
}

export type SignerResponse = Signer[]

export interface Signer {
  id: number
  uuid: string
  host: string
  enabled: boolean
  description: string
  type: string
  isMonoSigner: boolean
  createdAt: string
  updatedAt: string
  isReady: boolean
}

export type PaginatedResponse<T> = {
  total: number
  perPage: number
  lastPage: number
  firstPage: number
  data: T[]
}

export interface ValidationErrorResponse {
  errors: ValidationError[]
}

export interface ValidationError {
  message: string
  rule: string
  field: string
}
