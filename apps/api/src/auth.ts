import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { one, digest, Row } from './database';
export interface AuthRequest extends Request {
  user: Row;
}
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const token = req.cookies?.kapster_session;
    const user =
      typeof token === 'string'
        ? one(
            'SELECT u.* FROM users u JOIN sessions s ON s.userId=u.id WHERE s.token=? AND s.expires>? AND u.active=1 AND u.verified=1',
            digest(token),
            Date.now(),
          )
        : undefined;
    if (!user) throw new UnauthorizedException('Silakan masuk kembali.');
    req.user = user;
    return true;
  }
}
export function role(user: Row, ...roles: string[]) {
  if (!roles.includes(user.role))
    throw new ForbiddenException('Anda tidak memiliki akses untuk tindakan ini.');
}
export function scope(user: Row, outletId?: string) {
  if (!user.orgId) throw new ForbiddenException('Akses organisasi diperlukan.');
  if (outletId && !one('SELECT id FROM outlets WHERE id=? AND orgId=?', outletId, user.orgId))
    throw new ForbiddenException('Outlet tidak tersedia untuk akun ini.');
  if (user.role === 'cashier' && outletId && user.outletId !== outletId)
    throw new ForbiddenException('Anda hanya dapat mengakses outlet penugasan.');
}
export function operational(user: Row) {
  scope(user);
  if (one('SELECT status FROM orgs WHERE id=?', user.orgId)?.status !== 'approved')
    throw new ForbiddenException('Operasional tersedia setelah bisnis disetujui Admin.');
}
export function safeUser(user: Row) {
  const { password, ...safe } = user;
  return safe;
}
