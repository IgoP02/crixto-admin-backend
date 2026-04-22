import { PermissionSchema } from '#database/schema'
import Module from '#models/module'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Permission extends PermissionSchema {
  @belongsTo(() => Module)
  declare Module: BelongsTo<typeof Module>
}
