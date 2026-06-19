import { Request } from 'express'

export type AdminRole = 'admin'
export type RoomRole = 'leader' | 'volunteer'

export interface AdminJwtPayload {
  adminId: string
  role: AdminRole
}

export interface RoomJwtPayload {
  roomSlug: string
  role: RoomRole
}

export interface AuthedRequest extends Request {
  admin?: AdminJwtPayload
  roomAccess?: RoomJwtPayload
}

export interface ApiSuccess<T> {
  data: T
}

export interface ApiError {
  error: string
}
