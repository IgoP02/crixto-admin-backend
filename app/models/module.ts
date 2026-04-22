import { ModuleSchema } from '#database/schema'
import Permission from '#models/permission'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Module extends ModuleSchema {
  @hasMany(() => Permission)
  declare permissions: HasMany<typeof Permission>
}
