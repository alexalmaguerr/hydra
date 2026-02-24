import { Controller, Get } from '@nestjs/common';

@Controller('consumos')
export class ConsumosController {
  @Get()
  findAll() {
    return [];
  }
}
