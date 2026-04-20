export type EndpointShape<T, Y> = {
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
      route: '/crypto-assets/token'
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
  liquidity: {
    snapshot: {
      method: 'GET'
      route: '/transactions/liquidity/snapshot'
      response: LiquiditySnapshotResponse
    }
  }
  thresholds: {
    update: {
      route: `/crypto-asset-thresholds/${number}/${number}`
      method: 'PUT'
      payload: {
        accountDailyWithdrawLimit: string
        accountsWithdrawMinFunds: number
        accountsWithdrawMaxFunds: number
      }
      response: {
        accountDailyWithdrawLimit: number
        accountsWithdrawMinFunds: string
        accountsWithdrawMaxFunds: string
      }
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

export interface LiquidityThreshold {
  accountDailyWitdrawLimit: string
  accountWithdrawMinFunds: number
  accountWithdrawMaxFunds: number
}

export interface LiquidityGasItem {
  networkId: number
  description: string
  coinName: string
  gasAddress: string
  gasBalance: string
}

export interface LiquidityWalletBalanceItem {
  assetId: number
  assetName: string
  assetType: string
  balance: string
  address: string
  thresholds: LiquidityThreshold
}

export interface LiquidityWalletItem {
  walletId: number
  walletUuid: string
  walletProxyContract: string
  type: string
  enabled: boolean
  networkId: number
  networkName: string
  networkEnabled: boolean
  balances: LiquidityWalletBalanceItem[]
}

export interface LiquidityBalanceItem {
  networkId: number
  networkName: string
  cryptoAssetId: number
  cryptoAssetname: string
  cryptoAssetType: string
  balance: string
  balanceOut: string
  balanceCold: string
  thresholds: LiquidityThreshold
}

export interface LiquiditySnapshotResponse {
  gas: LiquidityGasItem[]
  wallets: LiquidityWalletItem[]
  balances: LiquidityBalanceItem[]
}

/**
 * SOCKET SERVICE
 */

// ---------------------------------------------------------------------------
// Liquidity WebSocket events (server → client, room: 'liquidity')
// ---------------------------------------------------------------------------

/** Emitted once when a client joins the 'liquidity' room to confirm connection. */
export interface LiquidityOnlinePayload {
  liquidity: 'online'
}

/** Emitted after each liquidity cycle with gas wallet balances for all enabled networks. */
export interface LiquidityGasPayload {
  gas: LiquidityGasItem[]
}

/**
 * Emitted after each liquidity cycle.
 * Two shapes are sent in sequence:
 *   1. { wallets }  — raw per-wallet balances for every asset/network
 *   2. { balances } — derived cold/out balance comparison per asset/network
 */
export type LiquidityBalancesPayload =
  | { wallets: LiquidityWalletItem[] }
  | { balances: LiquidityBalanceItem[] }
  | LiquidityOnlinePayload

/** Emitted throughout the liquidity decision process as human-readable log lines. */
export interface LiquidityConsolePayload {
  text: string
}

/**
 * Full map of events and their payloads emitted by the server
 * on the 'liquidity' Socket.IO room.
 *
 * Usage (socket.io-client):
 *   socket.on('gas',      (data: LiquidityGasPayload)      => { ... })
 *   socket.on('balances', (data: LiquidityBalancesPayload) => { ... })
 *   socket.on('console',  (data: LiquidityConsolePayload)  => { ... })
 */
export interface LiquidityServerEvents {
  gas: LiquidityGasPayload
  balances: LiquidityBalancesPayload
  console: LiquidityConsolePayload
}

/**
 * Events emitted by the client to the server for the 'liquidity' room.
 * Both events carry no payload — they only signal intent to join the room.
 *
 * Usage (socket.io-client):
 *   socket.emit('join_liquidity')
 */
export interface LiquidityClientEvents {
  join_liquidity: () => void
}
