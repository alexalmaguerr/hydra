/**
 * PortalGuard — protects routes that must only be accessible by external
 * portal customers (role = CLIENTE).
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, PortalGuard)
 *   @Get('portal/mi-cuenta')
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class PortalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as unknown as { user?: { role?: string } }).user;

    if (!user?.role || user.role !== 'CLIENTE') {
      throw new ForbiddenException(
        'Solo clientes del portal pueden acceder a este recurso.',
      );
    }
    return true;
  }
}
