import passkeyConfig from '#config/passkey'
import Passkey from '#models/passkey'
import User from '#models/user'
import UserTransformer from '#transformers/user_transformer'
import cache from '@adonisjs/cache/services/main'
import type { HttpContext } from '@adonisjs/core/http'
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  Base64URLString,
  RegistrationResponseJSON,
} from '@simplewebauthn/server'
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import vine from '@vinejs/vine'
import { randomUUID } from 'node:crypto'

const PASSKEY_FLOW_TTL = '5m'

type RegisterFlowPayload = {
  challenge: string
  userId: number
  webauthnUserId: string
}

type LoginFlowPayload = {
  challenge: string
}

function registerFlowKey(flowId: string) {
  return `passkey:register:${flowId}`
}

function loginFlowKey(flowId: string) {
  return `passkey:login:${flowId}`
}

const loginOptionsValidator = vine.create(
  vine.object({
    email: vine.string().email().optional(),
  })
)

const registerVerifyValidator = vine.create(
  vine.object({
    flowId: vine.string().uuid(),
    id: vine.string().trim(),
    rawId: vine.string().trim(),
    type: vine.string().trim(),
    authenticatorAttachment: vine.string().trim().nullable().optional(),
    clientExtensionResults: vine.any(),
    response: vine.any(),
  })
)

const loginVerifyValidator = vine.create(
  vine.object({
    flowId: vine.string().uuid(),
    id: vine.string().trim(),
    rawId: vine.string().trim(),
    type: vine.string().trim(),
    authenticatorAttachment: vine.string().trim().nullable().optional(),
    clientExtensionResults: vine.any(),
    response: vine.any(),
  })
)

export default class PasskeyAuthController {
  async registerOptions({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load((preloader) => preloader.load('passkeys'))

    const options = await generateRegistrationOptions({
      rpName: passkeyConfig.rp.name,
      rpID: passkeyConfig.rp.id,
      userName: user.email,
      userID: new Uint8Array(Buffer.from(user.id.toString())),
      attestationType: 'none',
      excludeCredentials: user.passkeys.map((passkey) => ({
        id: passkey.id as Base64URLString,
        transports: passkey.transports
          ? (passkey.transports.split(',') as AuthenticatorTransportFuture[])
          : [],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    })

    const flowId = randomUUID()

    await cache.set({
      key: registerFlowKey(flowId),
      value: {
        challenge: options.challenge,
        userId: user.id,
        webauthnUserId: options.user.id,
      } satisfies RegisterFlowPayload,
      ttl: PASSKEY_FLOW_TTL,
    })

    return {
      flowId,
      options,
    }
  }

  async verifyRegister({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { flowId, ...registrationResponse } = await request.validateUsing(registerVerifyValidator)
    const flow = (await cache.get({ key: registerFlowKey(flowId) })) as RegisterFlowPayload | null

    if (!flow || flow.userId !== user.id) {
      return response.badRequest({ message: 'No active registration challenge found in cache' })
    }

    let verification
    try {
      verification = await verifyRegistrationResponse({
        response: registrationResponse as RegistrationResponseJSON,
        expectedChallenge: flow.challenge,
        expectedOrigin: passkeyConfig.rp.origins,
        expectedRPID: passkeyConfig.rp.id,
      })
    } catch (error) {
      return response.badRequest({ message: (error as Error).message })
    }

    await cache.delete({ key: registerFlowKey(flowId) })

    const { verified, registrationInfo } = verification

    if (verified && registrationInfo) {
      const { credential, credentialBackedUp } = registrationInfo

      await Passkey.create({
        userId: user.id,
        webauthnUserId: flow.webauthnUserId,
        id: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        backedUp: credentialBackedUp,
        transports: credential.transports?.join(',') ?? '',
      })
    }

    return { verified }
  }

  async loginOptions({ request }: HttpContext) {
    const { email } = await request.validateUsing(loginOptionsValidator)

    let allowCredentials: { id: Base64URLString; transports?: AuthenticatorTransportFuture[] }[] =
      []

    if (email) {
      const user = await User.findBy('email', email)

      if (user) {
        await user.load((preloader) => preloader.load('passkeys'))
        allowCredentials = user.passkeys.map((passkey) => ({
          id: passkey.id as Base64URLString,
          transports: passkey.transports
            ? (passkey.transports.split(',') as AuthenticatorTransportFuture[])
            : [],
        }))
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: passkeyConfig.rp.id,
      allowCredentials,
      userVerification: 'preferred',
    })

    const flowId = randomUUID()

    await cache.set({
      key: loginFlowKey(flowId),
      value: {
        challenge: options.challenge,
      } satisfies LoginFlowPayload,
      ttl: PASSKEY_FLOW_TTL,
    })

    return {
      flowId,
      options,
    }
  }

  async verifyLogin({ request, response, serialize }: HttpContext) {
    const { flowId, ...authenticationResponse } = await request.validateUsing(loginVerifyValidator)
    const flow = (await cache.get({ key: loginFlowKey(flowId) })) as LoginFlowPayload | null

    if (!flow) {
      return response.badRequest({ message: 'No active authentication challenge found in cache' })
    }

    const passkey = await Passkey.findBy('id', authenticationResponse.id)

    if (!passkey) {
      return response.badRequest({
        message: `Passkey with id '${authenticationResponse.id}' not found`,
      })
    }

    let verification
    try {
      verification = await verifyAuthenticationResponse({
        response: authenticationResponse as AuthenticationResponseJSON,
        expectedChallenge: flow.challenge,
        expectedOrigin: passkeyConfig.rp.origins,
        expectedRPID: passkeyConfig.rp.id,
        credential: {
          id: passkey.id as Base64URLString,
          publicKey: new Uint8Array(passkey.publicKey),
          counter: Number(passkey.counter),
          transports: passkey.transports
            ? (passkey.transports.split(',') as AuthenticatorTransportFuture[])
            : [],
        },
      })
    } catch (error) {
      return response.badRequest({ message: (error as Error).message })
    }

    await cache.delete({ key: loginFlowKey(flowId) })

    const { verified, authenticationInfo } = verification

    if (!verified) {
      return response.unauthorized({ message: 'Passkey verification failed' })
    }

    passkey.counter = authenticationInfo.newCounter
    await passkey.save()

    const user = await passkey.related('user').query().firstOrFail()

    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
