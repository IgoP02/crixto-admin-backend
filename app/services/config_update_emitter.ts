import { getIo } from '#services/socket_service'

export type ConfigUpdateType = 'crypto-asset' | 'network' | 'signer'

export function emitConfigUpdate(
  type: ConfigUpdateType,
  action: 'store' | 'update' | 'disable' | 'enable' | 'ready_status',
  payload: unknown
): void {
  getIo().emit('config_update', { type, action, payload })
}
