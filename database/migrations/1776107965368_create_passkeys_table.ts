import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'passkeys'

  async up() {
    if (!(await this.schema.hasTable(this.tableName)))
      this.schema.createTable(this.tableName, (table) => {
        table.increments('cred_id', { primaryKey: true })
        table.text('id').index().notNullable()
        table.binary('publicKey').notNullable()
        table
          .integer('user_id')
          .unsigned()
          .references('id')
          .inTable('users')
          .onDelete('RESTRICT')
          .notNullable()
        table.text('webauthn_user_id').index().notNullable()
        table.bigint('counter').unsigned().notNullable()
        table.boolean('backed_up').notNullable()
        table.string('transports', 255).notNullable()
      })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
