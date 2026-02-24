import { Controller, Get } from '@nestjs/common';

@Controller('pagos-externos')
export class PagosExternosController {
  @Get()
  findAll() {
    return [];
  }
}
