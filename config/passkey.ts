import env from '#start/env'

export default {
  rp: {
    name: env.get('WAUTHN_RP_NAME'),
    id: env.get('WAUTHN_RP_ID'),
    origins: env
      .get('WAUTHN_RP_ORIGIN')
      .split(',')
      .map((o) => o.trim()),
  },
}
