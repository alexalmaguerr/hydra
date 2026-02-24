import { Controller, Get } from '@nestjs/common';

@Controller('pagos')
export class PagosController {
  @Get()
  findAll() {
    return [];
  }
}
