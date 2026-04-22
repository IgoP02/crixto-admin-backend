import { UserSchema } from '#database/schema'
import Passkey from '#models/passkey'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Permission from './permission.ts'

export default class User extends compose(
  UserSchema,
  withAuthFinder(() => hash.use())
) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  @column({ columnName: 'requires_passkey_login' })
  declare requiresPasskeyLogin: boolean

  @hasMany(() => Passkey, {
    foreignKey: 'userId',
  })
  declare passkeys: HasMany<typeof Passkey>

  @manyToMany(() => Permission, { pivotTable: 'user_permissions' })
  declare permissions: ManyToMany<typeof Permission>

  get fullName() {
    return [this.givenNames, this.lastNames].filter(Boolean).join(' ').trim() || null
  }

  get initials() {
    const source = this.fullName ?? this.email.split('@')[0]
    const parts = source.split(' ').filter(Boolean)

    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    }

    return source.slice(0, 2).toUpperCase()
  }
}
