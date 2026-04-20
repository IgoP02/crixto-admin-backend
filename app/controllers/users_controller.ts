import User from '#models/user'
import UserTransformer from '#transformers/user_transformer'
import { loginValidator, signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
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

    return serialize({
      user: UserTransformer.transform(user),
    })
  }

  async login({ request, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
