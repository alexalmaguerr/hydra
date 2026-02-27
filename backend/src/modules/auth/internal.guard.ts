/**
 * InternalGuard — protects routes that must only be accessible by internal
 * staff users (SUPER_ADMIN, ADMIN, OPERADOR, LECTURISTA, ATENCION_CLIENTES).
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, InternalGuard)
 *   @Get('some-internal-route')
 *
 * Combined with JwtAuthGuard so the JWT is validated before role check.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';

const INTERNAL_ROLES = new Set([
  'SUPER_ADMIN',
  'ADMIN',
  'OPERADOR',
  'LECTURISTA',
  'ATENCION_CLIENTES',
]);

@Injectable()
export class InternalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as unknown as { user?: { role?: string } }).user;

    if (!user?.role || !INTERNAL_ROLES.has(user.role)) {
      throw new ForbiddenException(
        'Solo usuarios internos pueden acceder a este recurso.',
      );
    }
    return true;
  }
}
