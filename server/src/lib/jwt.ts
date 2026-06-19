import jwt, { SignOptions } from 'jsonwebtoken'
import { AdminJwtPayload, RoomJwtPayload } from '../types'

const secret = () => {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set')
  return s
}

export const signAdminToken = (payload: AdminJwtPayload) =>
  jwt.sign(payload, secret(), { expiresIn: (process.env.ADMIN_JWT_EXPIRES_IN ?? '7d') } as SignOptions)

export const signRoomToken = (payload: RoomJwtPayload) =>
  jwt.sign(payload, secret(), { expiresIn: (process.env.ROOM_TOKEN_EXPIRES_IN ?? '24h') } as SignOptions)

export const verifyToken = <T>(token: string): T =>
  jwt.verify(token, secret()) as T
