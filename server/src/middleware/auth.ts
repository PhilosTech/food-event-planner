import { Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt'
import { AdminJwtPayload, AuthedRequest, RoomJwtPayload, RoomRole } from '../types'

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing admin token' })
    return
  }
  try {
    req.admin = verifyToken<AdminJwtPayload>(header.slice(7))
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired admin token' })
  }
}

export function requireRoomAccess(minRole?: RoomRole) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing room token' })
      return
    }
    try {
      const payload = verifyToken<RoomJwtPayload>(header.slice(7))
      if (payload.roomSlug !== req.params.slug) {
        res.status(401).json({ error: 'Token does not match this room' })
        return
      }
      if (minRole === 'leader' && payload.role !== 'leader') {
        res.status(403).json({ error: 'Leader access required' })
        return
      }
      req.roomAccess = payload
      next()
    } catch {
      res.status(401).json({ error: 'Invalid or expired room token' })
    }
  }
}
