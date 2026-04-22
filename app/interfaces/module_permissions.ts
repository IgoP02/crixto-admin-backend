export type AppModule =
  | 'system'
  | 'auth'
  | 'account'
  | 'users'
  | 'crypto_assets'
  | 'networks'
  | 'signers'
  | 'liquidity'

export type PermissionType = 'read' | 'create' | 'update' | 'delete' | 'revoke' | 'run'

export type RouteAction = {
  module: AppModule
  action: string
  permission: PermissionKey | null
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  controller: string
  isPublic: boolean
}

export type PermissionShape = {
  id: number
  name: string
  key: string
  doubleAuth: boolean
  type: PermissionType
}

export type ModuleShape = {
  id: number
  key: AppModule
  name: string
  admin: boolean
  permissions: PermissionShape[]
}

export const MODULES: ModuleShape[] = [
  {
    id: 2,
    key: 'auth',
    name: 'Authentication',
    admin: true,
    permissions: [],
  },
  {
    id: 3,
    key: 'account',
    name: 'Account',
    admin: false,
    permissions: [
      { id: 301, name: 'Account read', key: 'account.read', type: 'read', doubleAuth: false },
    ],
  },
  {
    id: 4,
    key: 'users',
    name: 'Users',
    admin: true,
    permissions: [
      { id: 401, name: 'User create', key: 'users.create', type: 'create', doubleAuth: true },
    ],
  },
  {
    id: 5,
    key: 'crypto_assets',
    name: 'Crypto Assets',
    admin: true,
    permissions: [
      {
        id: 501,
        name: 'Crypto assets read',
        key: 'crypto_assets.read',
        type: 'read',
        doubleAuth: false,
      },
      {
        id: 502,
        name: 'Asset create',
        key: 'crypto_assets.create',
        type: 'create',
        doubleAuth: true,
      },
      {
        id: 503,
        name: 'Asset update',
        key: 'crypto_assets.update',
        type: 'update',
        doubleAuth: true,
      },
    ],
  },
  {
    id: 6,
    key: 'networks',
    name: 'Networks',
    admin: true,
    permissions: [
      { id: 601, name: 'Networks read', key: 'networks.read', type: 'read', doubleAuth: false },
      { id: 602, name: 'Network update', key: 'networks.update', type: 'update', doubleAuth: true },
    ],
  },
  {
    id: 7,
    key: 'signers',
    name: 'Signers',
    admin: true,
    permissions: [
      { id: 701, name: 'Signers read', key: 'signers.read', type: 'read', doubleAuth: false },
      { id: 702, name: 'Signer create', key: 'signers.create', type: 'create', doubleAuth: true },
      { id: 703, name: 'Signer update', key: 'signers.update', type: 'update', doubleAuth: true },
    ],
  },
  {
    id: 8,
    key: 'liquidity',
    name: 'Liquidity',
    admin: true,
    permissions: [
      { id: 801, name: 'Liquidity read', key: 'liquidity.read', type: 'read', doubleAuth: false },
    ],
  },
]

export type PermissionKey = (typeof MODULES)[number]['permissions'][number]['key']

export const MODULE_PERMISSIONS = Object.fromEntries(
  MODULES.map((module) => [module.key, module.permissions.map((permission) => permission.key)])
) as Record<AppModule, PermissionKey[]>

export const MODULES_BY_KEY = Object.fromEntries(
  MODULES.map((module) => [module.key, module])
) as Record<AppModule, ModuleShape>

export const PERMISSIONS = MODULES.flatMap((module) =>
  module.permissions.map((permission) => ({
    ...permission,
    moduleId: module.id,
    moduleKey: module.key,
  }))
)
