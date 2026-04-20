import User from '#models/user'
import env from '#start/env'
import { Secret } from '@adonisjs/core/helpers'
import type { Server as HttpServer } from 'node:http'
import { Server as SocketServer } from 'socket.io'
import { io as connectUpstream, type Socket as ClientSocket } from 'socket.io-client'
import {
  type LiquidityBalancesPayload,
  type LiquidityConsolePayload,
  type LiquidityGasPayload,
} from '../interfaces/upstream_api.ts'

let io: SocketServer | null = null
let upstreamSocket: ClientSocket | null = null

export function getIo(): SocketServer {
  if (!io) throw new Error('Socket.io server is not initialized')
  return io
}

export function initSocketServer(httpServer: HttpServer): SocketServer {
  const isDev = env.get('NODE_ENV') === 'development'

  io = new SocketServer(httpServer, {
    cors: {
      origin: isDev ? '*' : env.get('APP_URL'),
      credentials: true,
    },
  })

  // Authenticate connections with the API bearer token
  io.use(async (socket, next) => {
    try {
      if (env.get('NODE_ENV') !== 'production') return next()
      const raw = socket.handshake.auth?.token as string | undefined
      if (!raw) return next(new Error('Authentication required'))

      const tokenValue = raw.startsWith('Bearer ') ? raw.slice(7) : raw
      const token = await User.accessTokens.verify(new Secret(tokenValue))
      if (!token) return next(new Error('Invalid or expired token'))

      socket.data.userId = token.tokenableId
      next()
    } catch {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`[socket] Client connected: ${socket.id} (userId=${socket.data.userId})`)
    socket.on('disconnect', () => {
      console.log(`[socket] Client disconnected: ${socket.id}`)
    })
    socket.on('join_liquidity', () => {
      socket.join('liquidity')
      console.log(`[socket] Client ${socket.id} joined 'liquidity' room`)
    })
  })

  // Connect to the upstream socket.io server
  upstreamSocket = connectUpstream(env.get('UPSTREAM_SOCKET_URL'), {
    auth: {
      token: env.get('SOCKET_IO_AUTH_TOKEN'),
    },
    extraHeaders: {
      'X-Api-Key': env.get('UPSTREAM_API_KEY'),
    },
    reconnection: true,
    reconnectionDelay: 3000,
  })

  upstreamSocket.on('connect', () => {
    console.log('[socket] Connected to upstream socket')
    upstreamSocket?.emit('join_liquidity')
  })

  upstreamSocket.on('disconnect', (reason) => {
    console.log(`[socket] Disconnected from upstream socket: ${reason}`)
  })

  upstreamSocket.on('connect_error', (err) => {
    console.error(`[socket] Upstream connection error: ${err.message}`)
  })

  // Forward every upstream event to all connected admin clients
  /*   upstreamSocket.onAny((event: string, ...args: unknown[]) => {
    io!.emit(event, ...args)
  }) */

  upstreamSocket.on('gas', (data: LiquidityGasPayload) => {
    io?.to('liquidity').emit('gas', data)

    /* data: LiquidityGasPayload     */
  })
  upstreamSocket.on('balances', (data: LiquidityBalancesPayload) => {
    io?.to('liquidity').emit('balances', data)

    /* data: LiquidityBalancesPayload */
  })
  upstreamSocket.on('console', (data: LiquidityConsolePayload) => {
    console.log(data.text)

    /* data: LiquidityConsolePayload  */
  })

  return io
}

export function closeSocketServer(): void {
  upstreamSocket?.disconnect()
  io?.close()
  io = null
  upstreamSocket = null
}
