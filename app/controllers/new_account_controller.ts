import User from '#models/user'
import UserTransformer from '#transformers/user_transformer'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class NewAccountController {
  async store({ request, serialize }: HttpContext) {
    const { fullName, email, password, requiresPasskeyLogin } =
      await request.validateUsing(signupValidator)

    const nameParts = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
    const givenNames = nameParts.length ? nameParts.slice(0, -1).join(' ') || nameParts[0] : null
    const lastNames = nameParts.length > 1 ? (nameParts.at(-1) ?? null) : null

    const user = await User.create({
      givenNames,
      lastNames,
      email,
      password,
      requiresPasskeyLogin: requiresPasskeyLogin ?? false,
    })
    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
