import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      id: this.resource.id,
      fullName: this.resource.fullName,
      email: this.resource.email,
      requiresPasskeyLogin: this.resource.requiresPasskeyLogin,
      createdAt: this.resource.createdAt,
      updatedAt: this.resource.updatedAt,
      initials: this.resource.initials,
    }
  }
}
