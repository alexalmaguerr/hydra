import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PortalService } from './portal.service';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  contratoIds: string[];
}

@UseGuards(JwtAuthGuard)
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('contratos')
  getContratos(@Req() req: Request) {
    const user = req.user as AuthUser;
    return this.portalService.getContratos(user.contratoIds ?? []);
  }

  @Get('consumos')
  getConsumos(@Query('contratoId') contratoId: string, @Req() req: Request) {
    const user = req.user as AuthUser;
    return this.portalService.getConsumos(contratoId, user.contratoIds ?? []);
  }

  @Get('timbrados')
  getTimbrados(@Query('contratoId') contratoId: string, @Req() req: Request) {
    const user = req.user as AuthUser;
    return this.portalService.getTimbrados(contratoId, user.contratoIds ?? []);
  }

  @Get('recibos')
  getRecibos(@Query('contratoId') contratoId: string, @Req() req: Request) {
    const user = req.user as AuthUser;
    return this.portalService.getRecibos(contratoId, user.contratoIds ?? []);
  }

  @Get('pagos')
  getPagos(@Query('contratoId') contratoId: string, @Req() req: Request) {
    const user = req.user as AuthUser;
    return this.portalService.getPagos(contratoId, user.contratoIds ?? []);
  }

  @Get('saldos')
  getSaldos(@Query('contratoId') contratoId: string, @Req() req: Request) {
    const user = req.user as AuthUser;
    return this.portalService.getSaldos(contratoId, user.contratoIds ?? []);
  }
}
