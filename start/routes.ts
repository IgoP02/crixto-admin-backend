/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { controllers } from '#generated/controllers'
import User from '#models/user'
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { randomInt } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const OPENAPI_FILE_URL = new URL('../openapi.yaml', import.meta.url)

router.get('/', () => {
  return { hello: 'world' }
})

router.get('/docs/openapi.yaml', async ({ response }) => {
  const spec = await readFile(OPENAPI_FILE_URL, 'utf8')
  response.header('Content-Type', 'application/yaml; charset=utf-8')
  return spec
})

router.post('/default-setup', async ({ request, response }) => {
  const charPool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const randomPassword = Array.from(
    { length: 8 },
    () => charPool[randomInt(0, charPool.length)]
  ).join('')

  const email = request.input('email')
  if (!(await User.query().where('super', true).first())) {
    const payload = { super: true, email, password: randomPassword }

    const defaultUser = await User.create(payload)
    response.ok({ email, password: randomPassword, user: defaultUser.serialize() })
  } else {
    response.badRequest({ message: 'Super user already exists' })
  }
})

router.get('/docs', ({ response }) => {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Crixto Admin API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #f4f7fb;
      }
      #swagger-ui {
        max-width: 1200px;
        margin: 0 auto;
      }
      .topbar {
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" crossorigin></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/docs/openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'BaseLayout',
      })
    </script>
  </body>
</html>`

  response.header('Content-Type', 'text/html; charset=utf-8')
  return html
})

router.group(() => {
  router
    .group(() => {
      router.post('signup', [controllers.NewAccount, 'store'])
      router.post('login', [controllers.AccessToken, 'login'])
      router
        .post('logout', [controllers.AccessToken, 'logout'])
        .use(middleware.auth({ guards: ['api'] }))

      router.post('passkey/login/options', [controllers.PasskeyAuth, 'loginOptions'])
      router.post('passkey/login/verify', [controllers.PasskeyAuth, 'verifyLogin'])
      router
        .post('passkey/register/options', [controllers.PasskeyAuth, 'registerOptions'])
        .use(middleware.auth())
      router
        .post('passkey/register/verify', [controllers.PasskeyAuth, 'verifyRegister'])
        .use(middleware.auth())
    })
    .prefix('auth')
    .as('auth')

  router
    .group(() => {
      router.get('/profile', [controllers.Profile, 'show'])
    })
    .prefix('account')
    .as('profile')
    .use(middleware.auth())

  router
    .group(() => {
      router.post('/', [controllers.NewAccount, 'store']).use(middleware.auth())
    })
    .prefix('users')
    .as('users')

  router
    .group(() => {
      router.get('/', [controllers.Currencies, 'index'])
      router.post('/', [controllers.Currencies, 'store'])
      router.put('/:id', [controllers.Currencies, 'update'])
      router.put('/movement-threshold', [controllers.Currencies, 'updateThresholds'])
    })
    .prefix('crypto_assets')
    .as('crypto_assets')
    .use(middleware.auth())

  router
    .group(() => {
      router.get('/', [controllers.Networks, 'index'])
      router.post('/:id/toggle-status', [controllers.Networks, 'toggleStatus'])
    })
    .prefix('networks')
    .as('networks')
    .use(middleware.auth())

  router
    .group(() => {
      router.get('/', [controllers.Signers, 'index'])
      router.post('/', [controllers.Signers, 'store'])
      router.post('/:id/disable', [controllers.Signers, 'disable'])
    })
    .prefix('signers')
    .as('signers')
    .use(middleware.auth())

  router
    .get('/snapshot', [controllers.Liquidities, 'getCurrent'])
    .prefix('liquidity')
    .as('liquidity')
    .use(middleware.auth())
})
